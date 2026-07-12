import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { Asset, Booking, Profile } from '../../lib/types';
import { getBookableResources, getBookings, createBooking, cancelBooking } from './operationsApi';
import { Calendar, Clock, Plus, X, AlertTriangle, CheckCircle, Trash2, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

export const ResourceBooking: React.FC = () => {
  const { profile } = useAuth();
  const [resources, setResources] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<(Booking & { resource?: Asset; booker?: Profile })[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  
  // Tab selector for right panel (Calendar vs List Log)
  const [rightTab, setRightTab] = useState<'calendar' | 'list'>('calendar');
  
  // Calendar month selection states
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formResourceId, setFormResourceId] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  
  // UI States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Time grid definition for the visual planner (8 AM to 6 PM)
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // [8, 9, 10, ..., 18]

  const loadData = async () => {
    try {
      const resList = await getBookableResources();
      setResources(resList);
      if (resList.length > 0 && !selectedResourceId) {
        setSelectedResourceId(resList[0].id);
      }
      
      const bookList = await getBookings();
      setBookings(bookList);
    } catch (err) {
      console.error("Error loading booking data:", err);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for DB changes to keep UI reactive
    const handleDbChange = () => loadData();
    window.addEventListener('mock-db-change', handleDbChange);
    return () => window.removeEventListener('mock-db-change', handleDbChange);
  }, [selectedResourceId]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const startDateTime = `${formDate}T${formStartTime}:00`;
    const endDateTime = `${formDate}T${formEndTime}:00`;

    try {
      await createBooking(
        formResourceId,
        profile.id,
        formPurpose,
        startDateTime,
        endDateTime
      );
      
      setSuccessMessage("Resource booked successfully!");
      setFormPurpose('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      if (err.message && err.message.includes("conflict")) {
        setErrorMessage("conflict - slot is unavailable");
      } else {
        setErrorMessage(err.message || "Failed to create booking.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!profile) return;
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        await cancelBooking(id, profile.id);
        setSuccessMessage("Booking cancelled successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to cancel booking.");
      }
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getBookingsForDay = (day: Date) => {
    const localYear = day.getFullYear();
    const localMonth = (day.getMonth() + 1).toString().padStart(2, '0');
    const localDay = day.getDate().toString().padStart(2, '0');
    const dayStr = `${localYear}-${localMonth}-${localDay}`;
    return bookings.filter(b => b.status !== 'cancelled' && b.start_time.startsWith(dayStr));
  };

  const selectedResource = resources.find(r => r.id === selectedResourceId);
  const resourceBookings = bookings.filter(b => b.resource_asset_id === selectedResourceId && b.status !== 'cancelled');

  // Helper to check if a resource is booked during a specific hour block
  const getBookingForHour = (hour: number) => {
    const checkTime = new Date(`${formDate}T${hour.toString().padStart(2, '0')}:00:00`);
    
    return resourceBookings.find(b => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      // Check if checkTime falls within booking range [start, end)
      return checkTime >= start && checkTime < end;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-indigo-200 to-indigo-400">
            Resource Booking
          </h1>
          <p className="text-slate-400 mt-1">
            Reserve conference rooms, company vehicles, and other shared resources.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              if (resources.length > 0) {
                setFormResourceId(selectedResourceId || resources[0].id);
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Book a Resource
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Scheduler (Left 2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Schedule Planner
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual timeline representation for the selected resource.
              </p>
            </div>
            
            {/* Resource Selector Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Resource:</label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-1.5 focus:border-indigo-500 focus:outline-none transition-all"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.tag})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker for Grid View */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-slate-950/45 rounded-xl border border-slate-900">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-400">Viewing Schedule Date:</span>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Timeline Grid */}
          <div className="space-y-3">
            {hours.map((hour) => {
              const booking = getBookingForHour(hour);
              const isBooked = !!booking;
              const displayHour = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;

              return (
                <div 
                  key={hour} 
                  className={`grid grid-cols-5 items-center p-3 rounded-xl border transition-all ${
                    isBooked 
                      ? 'bg-rose-950/20 border-rose-900/30 text-rose-300' 
                      : 'bg-slate-950/30 border-slate-900 text-slate-300 hover:bg-slate-900/30'
                  }`}
                >
                  <div className="col-span-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {displayHour}
                  </div>
                  
                  <div className="col-span-4 flex items-center justify-between">
                    {isBooked ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-900/50">
                          Booked
                        </span>
                        <span className="text-sm font-medium text-white">{booking.purpose}</span>
                        <span className="text-xs text-slate-400 sm:border-l sm:border-slate-800 sm:pl-2">
                          Reserved by {booking.booker?.name || 'Employee'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-900/30">
                          Available
                        </span>
                        <span className="text-xs text-slate-500 italic">No bookings scheduled</span>
                      </div>
                    )}
                    
                    {!isBooked && (
                      <button
                        onClick={() => {
                          setFormResourceId(selectedResourceId);
                          setFormStartTime(`${hour.toString().padStart(2, '0')}:00`);
                          setFormEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
                          setIsModalOpen(true);
                        }}
                        className="opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 sm:flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-900/50 px-2 py-1 rounded-md transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Quick Book
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bookings Logs Feed (Right Col) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[650px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Reservations</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual monthly calendar & list logs.
              </p>
            </div>
            
            {/* View Selector Tab */}
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setRightTab('calendar')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${
                  rightTab === 'calendar' 
                    ? 'bg-indigo-600 text-white shadow-md font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Calendar
              </button>
              <button
                type="button"
                onClick={() => setRightTab('list')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${
                  rightTab === 'list' 
                    ? 'bg-indigo-600 text-white shadow-md font-extrabold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                List Log
              </button>
            </div>
          </div>

          {rightTab === 'calendar' ? (
            <div className="flex-1 flex flex-col space-y-3.5">
              {/* MONTH TITLE AND CONTROLS */}
              <div className="flex items-center justify-between bg-slate-950/40 border border-slate-900 rounded-xl px-3 py-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* WEEKDAY LABELS */}
              <div className="grid grid-cols-7 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, index) => (
                  <div key={index} className="py-1">{d}</div>
                ))}
              </div>

              {/* DAYS CALENDAR GRID */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square bg-transparent" />;
                  }

                  const localYear = day.getFullYear();
                  const localMonth = (day.getMonth() + 1).toString().padStart(2, '0');
                  const localDay = day.getDate().toString().padStart(2, '0');
                  const dayStr = `${localYear}-${localMonth}-${localDay}`;
                  
                  const isSelected = formDate === dayStr;
                  const dayBookings = getBookingsForDay(day);
                  const hasBookings = dayBookings.length > 0;
                  const isToday = new Date().toDateString() === day.toDateString();

                  return (
                    <button
                      key={dayStr}
                      type="button"
                      onClick={() => setFormDate(dayStr)}
                      className={`relative aspect-square rounded-lg flex flex-col items-center justify-center border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/30'
                          : isToday
                          ? 'bg-slate-900 border-slate-800 text-indigo-400'
                          : 'bg-slate-950/20 border-slate-900/50 text-slate-350 hover:bg-slate-900/30 hover:border-slate-800'
                      }`}
                    >
                      <span>{day.getDate()}</span>
                      
                      {/* Density Dot Indicator */}
                      {hasBookings && (
                        <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-indigo-400'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TARGET DATE LOG LISTING */}
              <div className="bg-slate-950/25 border border-slate-900/80 rounded-xl p-3.5 space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Active Reservs. ({new Date(formDate).toLocaleDateString()})
                </span>
                
                {bookings.filter(b => b.status !== 'cancelled' && b.start_time.startsWith(formDate)).length === 0 ? (
                  <p className="text-[11px] text-slate-600 italic">No bookings on this day</p>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {bookings.filter(b => b.status !== 'cancelled' && b.start_time.startsWith(formDate)).map(b => (
                      <div key={b.id} className="text-xs bg-slate-900/40 p-2 rounded-lg border border-slate-850 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-white leading-tight">{b.purpose}</span>
                          <span className="text-[10px] text-slate-450 mt-0.5">
                            {b.resource?.name || 'Asset'} · {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold uppercase text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/20">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10">
                  <Clock className="w-10 h-10 mb-2 text-slate-600" />
                  <span className="text-sm">No reservations logged yet.</span>
                </div>
              ) : (
                bookings.map((b) => {
                  const isUpcoming = b.status === 'upcoming';
                  const isCancelled = b.status === 'cancelled';
                  const start = new Date(b.start_time);
                  const end = new Date(b.end_time);
                  const isOwned = profile && b.booked_by === profile.id;
                  
                  return (
                    <div 
                      key={b.id} 
                      className={`p-4 rounded-xl border relative transition-all ${
                        isCancelled 
                          ? 'bg-slate-950/20 border-slate-900 opacity-60' 
                          : 'bg-slate-950/45 border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/30">
                            {b.resource?.name || 'Shared Resource'}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-2">{b.purpose}</h4>
                        </div>
                        
                        {/* Status Badges */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCancelled 
                            ? 'bg-slate-850 text-slate-500' 
                            : isUpcoming 
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-900' 
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-900'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-400">
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {start.toLocaleDateString()} · {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p>
                          <span className="text-slate-500">Reserved by:</span> {b.booker?.name || 'Unknown'}
                        </p>
                      </div>

                      {/* Cancel action if owned/authorized and upcoming */}
                      {isUpcoming && !isCancelled && (isOwned || profile?.role === 'admin' || profile?.role === 'asset_manager') && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 px-2 py-1.5 rounded-lg border border-rose-950 transition-all w-full justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>

      {/* Booking Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden glass-panel rounded-2xl shadow-2xl border border-slate-800/80 bg-[#0c101d]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-900">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Reserve Resource
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMessage(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner (Overlap notification) */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-4 bg-rose-950/35 border border-rose-900/50 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-rose-300">Conflict Detected</h5>
                  <p className="text-xs text-rose-400 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mx-6 mt-4 p-4 bg-emerald-950/35 border border-emerald-900/50 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-emerald-300">Booking Confirmed</h5>
                  <p className="text-xs text-emerald-400 mt-0.5">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              
              {/* Select Resource */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Resource</label>
                <select
                  required
                  value={formResourceId}
                  onChange={(e) => setFormResourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.tag}) — {r.location || 'No location'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Booking Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Client Presentation, Board Meeting"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Date */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-3 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Start Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-3 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Time</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-3 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none transition-all"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMessage(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 font-medium transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-indigo-500/20 transition-all text-sm"
                >
                  {isLoading ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
