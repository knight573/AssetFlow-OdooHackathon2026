import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Booking, MaintenanceRequest, Asset, Profile, Notification } from '../../lib/types';
import { getMockData, setMockData, updateMockRow, insertMockRow } from '../../lib/mockDb';
import { logActivity } from '../../lib/activity';

// Helper to get all assets
export async function getAssets(): Promise<Asset[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('name');
    if (!error && data) return data as Asset[];
  }
  return getMockData<Asset>('assets');
}

// Get resources that can be booked (is_bookable = true)
export async function getBookableResources(): Promise<Asset[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('is_bookable', true)
      .order('name');
    if (!error && data) return data as Asset[];
  }
  return getMockData<Asset>('assets').filter((a) => a.is_bookable);
}

// Get all bookings with resource names and profiles
export async function getBookings(): Promise<(Booking & { resource?: Asset; booker?: Profile })[]> {
  let bookings: Booking[] = [];
  
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('start_time', { ascending: false });
    if (!error && data) {
      bookings = data as Booking[];
    } else {
      bookings = getMockData<Booking>('bookings');
    }
  } else {
    bookings = getMockData<Booking>('bookings');
  }

  // Join resource and user locally (reliable for both mock and DB fallback)
  const assetsList = await getAssets();
  const profilesList = getMockData<Profile>('profiles');

  return bookings.map((b) => ({
    ...b,
    resource: assetsList.find((a) => a.id === b.resource_asset_id),
    booker: profilesList.find((p) => p.id === b.booked_by),
  }));
}

// Check booking overlap (business rule)
export async function checkBookingOverlap(
  resourceId: string,
  requestedStart: string,
  requestedEnd: string,
  ignoreBookingId?: string
): Promise<boolean> {
  const reqStart = new Date(requestedStart);
  const reqEnd = new Date(requestedEnd);

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('bookings')
        .select('id')
        .eq('resource_asset_id', resourceId)
        .neq('status', 'cancelled')
        .lt('start_time', requestedEnd)
        .gt('end_time', requestedStart);

      if (ignoreBookingId) {
        query = query.neq('id', ignoreBookingId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return true; // Overlap exists
      }
    } catch (err) {
      console.error("Supabase booking check error, checking mock fallback:", err);
    }
  }

  // Check locally in mock database
  const bookings = getMockData<Booking>('bookings');
  const overlaps = bookings.filter((b) => {
    if (b.resource_asset_id !== resourceId) return false;
    if (b.status === 'cancelled') return false;
    if (ignoreBookingId && b.id === ignoreBookingId) return false;

    const bStart = new Date(b.start_time);
    const bEnd = new Date(b.end_time);

    // Overlap formula: start1 < end2 AND end1 > start2
    return bStart < reqEnd && bEnd > reqStart;
  });

  return overlaps.length > 0;
}

// Create new resource booking
export async function createBooking(
  resourceId: string,
  bookedBy: string,
  purpose: string,
  startTime: string,
  endTime: string
): Promise<Booking> {
  // Validate times
  if (new Date(startTime) >= new Date(endTime)) {
    throw new Error("End time must be after start time.");
  }

  // Business Rule: Validate overlap
  const isOverlapping = await checkBookingOverlap(resourceId, startTime, endTime);
  if (isOverlapping) {
    throw new Error("conflict - slot is unavailable");
  }

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const newBooking: Booking = {
    id,
    resource_asset_id: resourceId,
    booked_by: bookedBy,
    purpose,
    start_time: startTime,
    end_time: endTime,
    status: 'upcoming',
    created_at,
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        id,
        resource_asset_id: resourceId,
        booked_by: bookedBy,
        purpose,
        start_time: startTime,
        end_time: endTime,
        status: 'upcoming'
      })
      .select()
      .single();
    
    if (error) {
      console.error("Supabase insert error, saving to mock DB:", error);
    }
  }

  // Save to mock database
  insertMockRow<Booking>('bookings', newBooking);

  // Get asset info for logging
  const assets = await getAssets();
  const asset = assets.find((a) => a.id === resourceId);
  const resourceName = asset ? `${asset.name} (${asset.tag})` : 'Resource';

  // Log activity & create notification
  await logActivity({
    actorId: bookedBy,
    action: 'booking_created',
    entityType: 'booking',
    entityId: id,
    details: { resourceName, startTime, endTime, purpose },
    notifyUserId: bookedBy,
    notifyMessage: `Successfully booked ${resourceName} for "${purpose}" starting at ${new Date(startTime).toLocaleString()}`,
    notifyType: 'booking_confirmed'
  });

  // Create simulated Booking Confirmation Email Notification
  const profilesList = getMockData<Profile>('profiles');
  const userProfile = profilesList.find(p => p.id === bookedBy);
  const userEmail = userProfile ? userProfile.email : 'user@company.com';
  
  insertMockRow<Notification>('notifications', {
    id: crypto.randomUUID(),
    user_id: bookedBy,
    type: 'mock_email',
    message: `✉️ [Email Sent to ${userEmail}] Booking Confirmed: "${purpose}" (${resourceName}) has been reserved. Start: ${new Date(startTime).toLocaleString()}`,
    related_entity_type: 'booking',
    related_entity_id: id,
    is_read: false,
    created_at: created_at
  });

  return newBooking;
}

// Cancel Booking
export async function cancelBooking(bookingId: string, actorId: string): Promise<Booking> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select()
      .single();
    if (!error && data) {
      // sync local
      updateMockRow<Booking>('bookings', bookingId, { status: 'cancelled' });
    }
  }

  const updated = updateMockRow<Booking>('bookings', bookingId, { status: 'cancelled' });

  // Get details for activity log
  const bookings = getMockData<Booking>('bookings');
  const booking = bookings.find(b => b.id === bookingId);
  const assets = await getAssets();
  const asset = booking ? assets.find((a) => a.id === booking.resource_asset_id) : null;
  const resourceName = asset ? `${asset.name} (${asset.tag})` : 'Resource';

  await logActivity({
    actorId,
    action: 'booking_cancelled',
    entityType: 'booking',
    entityId: bookingId,
    details: { resourceName },
    notifyUserId: booking?.booked_by || undefined,
    notifyMessage: `Booking for ${resourceName} was cancelled.`,
    notifyType: 'booking_cancelled'
  });

  return updated;
}

// Get Maintenance Requests
export async function getMaintenanceRequests(): Promise<(MaintenanceRequest & { asset?: Asset; raiser?: Profile })[]> {
  let requests: MaintenanceRequest[] = [];

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      requests = data as MaintenanceRequest[];
    } else {
      requests = getMockData<MaintenanceRequest>('maintenance_requests');
    }
  } else {
    requests = getMockData<MaintenanceRequest>('maintenance_requests');
  }

  const assetsList = await getAssets();
  const profilesList = getMockData<Profile>('profiles');

  return requests.map((r) => ({
    ...r,
    asset: assetsList.find((a) => a.id === r.asset_id),
    raiser: profilesList.find((p) => p.id === r.raised_by),
  }));
}

// Create Maintenance Request
export async function createMaintenanceRequest(
  assetId: string,
  raisedBy: string,
  description: string,
  priority: 'low' | 'medium' | 'high',
  photoUrl: string | null = null
): Promise<MaintenanceRequest> {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const newReq: MaintenanceRequest = {
    id,
    asset_id: assetId,
    raised_by: raisedBy,
    issue_description: description,
    priority,
    photo_url: photoUrl,
    status: 'pending',
    technician_name: null,
    approved_by: null,
    created_at,
    resolved_at: null,
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('maintenance_requests')
      .insert({
        id,
        asset_id: assetId,
        raised_by: raisedBy,
        issue_description: description,
        priority,
        photo_url: photoUrl,
        status: 'pending'
      });
    if (error) {
      console.error("Supabase maintenance insert error, saving to mock DB:", error);
    }
  }

  insertMockRow<MaintenanceRequest>('maintenance_requests', newReq);

  const assets = await getAssets();
  const asset = assets.find(a => a.id === assetId);
  const assetLabel = asset ? `${asset.name} (${asset.tag})` : 'Asset';

  await logActivity({
    actorId: raisedBy,
    action: 'maintenance_raised',
    entityType: 'maintenance_request',
    entityId: id,
    details: { assetLabel, priority, description },
    notifyUserId: raisedBy,
    notifyMessage: `Raised a ${priority} priority maintenance request for ${assetLabel}`,
    notifyType: 'maintenance_raised'
  });

  return newReq;
}

// Update Maintenance status and synchronize asset status (P3 responsibility)
export async function updateMaintenanceStatus(
  id: string,
  status: MaintenanceRequest['status'],
  actorId: string,
  extra?: { technicianName?: string }
): Promise<MaintenanceRequest> {
  const updates: Partial<MaintenanceRequest> = { status };
  const timestamp = new Date().toISOString();

  if (status === 'approved') {
    updates.approved_by = actorId;
  } else if (status === 'technician_assigned' && extra?.technicianName) {
    updates.technician_name = extra.technicianName;
  } else if (status === 'resolved') {
    updates.resolved_at = timestamp;
  }

  // Get current record to find asset_id
  const requests = getMockData<MaintenanceRequest>('maintenance_requests');
  const currentReq = requests.find((r) => r.id === id);
  if (!currentReq) {
    throw new Error(`Request with id ${id} not found.`);
  }

  const assetId = currentReq.asset_id;

  // --- Real Supabase update ---
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', id);

      // Trigger Asset Status Flip
      if (status === 'approved') {
        await supabase
          .from('assets')
          .update({ status: 'under_maintenance' })
          .eq('id', assetId);
      } else if (status === 'resolved') {
        await supabase
          .from('assets')
          .update({ status: 'available' })
          .eq('id', assetId);
      }
    } catch (err) {
      console.error("Supabase operations error, updating local mock state:", err);
    }
  }

  // --- Mock DB update & Flip Asset Status ---
  const updatedReq = updateMockRow<MaintenanceRequest>('maintenance_requests', id, updates);

  let newAssetStatus: Asset['status'] | null = null;
  if (status === 'approved') {
    newAssetStatus = 'under_maintenance';
  } else if (status === 'resolved') {
    newAssetStatus = 'available';
  }

  if (newAssetStatus) {
    updateMockRow<Asset>('assets', assetId, { status: newAssetStatus });
  }

  // Log Activity
  const assets = await getAssets();
  const asset = assets.find((a) => a.id === assetId);
  const assetLabel = asset ? `${asset.name} (${asset.tag})` : 'Asset';

  let logMsg = `Maintenance request for ${assetLabel} updated to ${status}`;
  if (status === 'approved') {
    logMsg = `Maintenance approved for ${assetLabel}. Asset status set to 'Under Maintenance'.`;
  } else if (status === 'resolved') {
    logMsg = `Maintenance resolved for ${assetLabel}. Asset status reverted to 'Available'.`;
  } else if (status === 'technician_assigned' && extra?.technicianName) {
    logMsg = `Technician ${extra.technicianName} assigned to repair ${assetLabel}.`;
  }

  await logActivity({
    actorId,
    action: `maintenance_${status}`,
    entityType: 'maintenance_request',
    entityId: id,
    details: { assetLabel, status, technician: extra?.technicianName },
    notifyUserId: currentReq.raised_by || undefined,
    notifyMessage: logMsg,
    notifyType: `maintenance_${status}`
  });

  return updatedReq;
}
