import React, { useState, useEffect } from 'react';
import { db, stateDb } from '../../lib/supabase';
import { Asset, Allocation, Booking, MaintenanceRequest, Department, Category } from '../../lib/types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { 
  TrendingUp, Download, Printer, 
  Settings, Layers, AlertCircle, RefreshCw 
} from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const Reports: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allAssets = await db.getAssets();
      const allAllocations = await db.getAllocations();
      const allBookings = await db.getBookings();
      const allMaintenance = await db.getMaintenanceRequests();
      const allDepts = await db.getDepartments();
      const allCats = await db.getCategories();

      setAssets(allAssets);
      setAllocations(allAllocations);
      setBookings(allBookings);
      setMaintenance(allMaintenance);
      setDepartments(allDepts);
      setCategories(allCats);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. DATA PREPARATION: Utilization by Department
  // Count allocations + bookings per department
  const getDeptUtilizationData = () => {
    return departments.map(dept => {
      const allocsCount = allocations.filter(a => a.department_id === dept.id).length;
      // Bookings can be mapped via booked_by user's department
      const bookingsCount = bookings.filter(b => {
        const user = stateDb.getOne<any>('af_profiles', b.booked_by || '');
        return user?.department_id === dept.id;
      }).length;

      return {
        name: dept.name,
        Allocations: allocsCount,
        Bookings: bookingsCount,
        Total: allocsCount + bookingsCount
      };
    }).filter(d => d.Total > 0);
  };

  // 2. DATA PREPARATION: Asset Status Breakdown
  const getAssetStatusData = () => {
    const counts: Record<string, number> = {};
    assets.forEach(asset => {
      counts[asset.status] = (counts[asset.status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, value]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value
    }));
  };

  // 3. DATA PREPARATION: Maintenance Frequency over time (last 6 months)
  const getMaintenanceFreqData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    
    // Get last 6 months list
    const last6Months: { month: string; index: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      last6Months.push({ month: months[idx], index: idx, count: 0 });
    }

    maintenance.forEach(req => {
      const date = new Date(req.created_at || Date.now());
      const reqMonth = months[date.getMonth()];
      const match = last6Months.find(m => m.month === reqMonth);
      if (match) {
        match.count += 1;
      }
    });

    return last6Months.map(({ month, count }) => ({ name: month, Requests: count }));
  };

  // 4. DATA PREPARATION: Most-Used vs. Idle Assets
  const getAssetUsageStats = () => {
    const stats = assets.map(asset => {
      const allocCount = allocations.filter(a => a.asset_id === asset.id).length;
      const bookCount = bookings.filter(b => b.resource_asset_id === asset.id).length;
      const total = allocCount + bookCount;
      const cat = categories.find(c => c.id === asset.category_id)?.name || 'Other';
      return {
        id: asset.id,
        name: asset.name,
        tag: asset.tag,
        category: cat,
        status: asset.status,
        allocations: allocCount,
        bookings: bookCount,
        total
      };
    });

    const mostUsed = [...stats].sort((a, b) => b.total - a.total).slice(0, 5);
    const idle = stats.filter(s => s.total === 0).slice(0, 5);

    return { mostUsed, idle };
  };

  const { mostUsed, idle } = getAssetUsageStats();

  const handleExportCSV = () => {
    const data = assets.map(a => ({
      Asset_Tag: a.tag,
      Asset_Name: a.name,
      Category: categories.find(c => c.id === a.category_id)?.name || '',
      Location: a.location || '',
      Status: a.status,
      Condition: a.condition,
      Cost: a.acquisition_cost || '',
      Date: a.acquisition_date || ''
    }));

    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AssetFlow_Registry_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-8 print:bg-white print:text-black">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5 print:border-slate-300">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 print:text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-indigo-500 print:text-indigo-600" /> Analytics & Reports
          </h2>
          <p className="text-slate-400 print:text-slate-600 text-sm mt-1">
            Real-time analytics on asset utilization, maintenance requests, status metrics, and idle resources.
          </p>
        </div>
        <div className="flex gap-2.5 print:hidden">
          <button 
            onClick={fetchData}
            className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/60 rounded-xl text-slate-400 hover:text-slate-200 transition"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800 rounded-xl text-slate-200 font-medium text-xs transition"
          >
            <Download className="h-4 w-4" /> Export Registry CSV
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-100 border border-indigo-500/30 rounded-xl font-medium text-xs transition shadow-lg shadow-indigo-500/10"
          >
            <Printer className="h-4 w-4" /> Print PDF Report
          </button>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Assets', value: assets.length, icon: <Layers className="h-5 w-5 text-indigo-400" />, desc: 'Registered in database' },
          { title: 'Active Allocations', value: allocations.filter(a => a.status === 'active').length, icon: <TrendingUp className="h-5 w-5 text-green-400" />, desc: 'Currently checked out' },
          { title: 'Under Repair', value: assets.filter(a => a.status === 'under_maintenance').length, icon: <Settings className="h-5 w-5 text-amber-400" />, desc: 'In maintenance workflow' },
          { title: 'Lost Assets', value: assets.filter(a => a.status === 'lost').length, icon: <AlertCircle className="h-5 w-5 text-red-400" />, desc: 'Flagged missing in audits' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4.5 print:border-slate-350 print:bg-slate-50 flex flex-col justify-between h-[110px]">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 print:text-slate-600 font-medium">{kpi.title}</span>
              <div className="p-1.5 bg-slate-950/40 rounded-lg print:border print:border-slate-300">{kpi.icon}</div>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-100 print:text-slate-900">{kpi.value}</span>
              <span className="text-[10px] text-slate-500 print:text-slate-600 block mt-0.5">{kpi.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Utilization Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-4 print:border-slate-300 print:h-[350px]">
          <h3 className="text-sm font-extrabold uppercase text-slate-300 print:text-slate-900 tracking-wider flex items-center gap-1.5">
            Department Resource Utilization
          </h3>
          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getDeptUtilizationData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="print:hidden" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="Allocations" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bookings" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-4 print:border-slate-300 print:h-[350px]">
          <h3 className="text-sm font-extrabold uppercase text-slate-300 print:text-slate-900 tracking-wider flex items-center gap-1.5">
            Asset Status Distribution
          </h3>
          <div className="h-[230px] w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getAssetStatusData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getAssetStatusData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-[10px]">
            {getAssetStatusData().map((entry, index) => (
              <span key={entry.name} className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maintenance requests line chart */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 space-y-4 print:border-slate-300 print:h-[350px]">
          <h3 className="text-sm font-extrabold uppercase text-slate-300 print:text-slate-900 tracking-wider">
            Maintenance Frequency (6-Month Trend)
          </h3>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getMaintenanceFreqData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="print:hidden" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="Requests" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most-Used & Idle Assets List */}
        <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6 print:border-slate-300">
          {/* Most Used */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-indigo-400 print:text-indigo-700 tracking-wider">Most-Used Assets</h4>
            {mostUsed.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No usage logged.</p>
            ) : (
              <div className="space-y-2.5">
                {mostUsed.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.tag} · {item.category}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-indigo-400 text-sm">{item.total}</span>
                      <span className="text-[9px] text-slate-500 block">Total Uses</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Idle */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-400 print:text-amber-700 tracking-wider">Unused / Idle Assets</h4>
            {idle.length === 0 ? (
              <p className="text-xs text-slate-500 italic">All resources are active.</p>
            ) : (
              <div className="space-y-2.5">
                {idle.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.tag} · {item.category}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/50 capitalize">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
