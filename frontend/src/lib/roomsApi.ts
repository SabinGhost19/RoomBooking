/**
 * API functions for rooms and bookings
 */

import apiClient from './apiClient';

// ============ Room Types ============
export interface Room {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  price: number;
  amenities?: string[];
  image?: string;
  svg_id?: string;
  coordinates?: { x: number; y: number };
  is_available: boolean;
}

export interface RoomCreate {
  name: string;
  description?: string;
  capacity: number;
  price: number;
  amenities?: string[];
  image?: string;
  svg_id?: string;
  coordinates?: { x: number; y: number };
  is_available?: boolean;
}

export interface RoomUpdate {
  name?: string;
  description?: string;
  capacity?: number;
  price?: number;
  amenities?: string[];
  image?: string;
  svg_id?: string;
  coordinates?: { x: number; y: number };
  is_available?: boolean;
}

export interface RoomFilters {
  skip?: number;
  limit?: number;
  search?: string;
  min_capacity?: number;
  max_capacity?: number;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  sort_by?: 'name' | 'capacity' | 'price' | 'id';
  sort_order?: 'asc' | 'desc';
}

// ============ Booking Types ============
export interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  booking_date: string; // ISO date string
  start_time: string; // HH:MM:SS format
  end_time: string; // HH:MM:SS format
  status: 'upcoming' | 'completed' | 'cancelled';
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by_id?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingCreate {
  room_id: number;
  booking_date: string; // ISO date string YYYY-MM-DD
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  participant_ids?: number[];
}

export interface BookingUpdate {
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
  participant_ids?: number[];
}

export interface BookingWithDetails extends Booking {
  room_name?: string;
  organizer_name?: string;
  participant_ids: number[];
}

export interface AvailabilityCheck {
  room_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface UserSchedule {
  user_id: number;
  bookings: BookingWithDetails[];
}

// ============ Room API Functions ============

/**
 * Get list of rooms with optional filters
 */
export const getRooms = async (filters?: RoomFilters): Promise<Room[]> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await apiClient.get(`/rooms?${params.toString()}`);
  return response.data;
};

/**
 * Get total count of rooms matching filters
 */
export const getRoomsCount = async (filters?: Omit<RoomFilters, 'skip' | 'limit' | 'sort_by' | 'sort_order'>): Promise<number> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await apiClient.get(`/rooms/count?${params.toString()}`);
  return response.data.total;
};

/**
 * Get room by ID
 */
export const getRoom = async (roomId: number): Promise<Room> => {
  const response = await apiClient.get(`/rooms/${roomId}`);
  return response.data;
};

/**
 * Create a new room (managers only)
 */
export const createRoom = async (room: RoomCreate): Promise<Room> => {
  const response = await apiClient.post('/rooms', room);
  return response.data;
};

/**
 * Update a room (managers only)
 */
export const updateRoom = async (roomId: number, room: RoomUpdate): Promise<Room> => {
  const response = await apiClient.put(`/rooms/${roomId}`, room);
  return response.data;
};

/**
 * Delete a room (managers only)
 */
export const deleteRoom = async (roomId: number): Promise<void> => {
  await apiClient.delete(`/rooms/${roomId}`);
};

// ============ Booking API Functions ============

/**
 * Get current user's bookings
 */
export const getMyBookings = async (
  startDate?: string,
  endDate?: string,
  status?: 'upcoming' | 'completed' | 'cancelled'
): Promise<Booking[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (status) params.append('status', status);
  
  const response = await apiClient.get(`/bookings/my-bookings?${params.toString()}`);
  return response.data;
};

/**
 * Get current user's schedule
 */
export const getMySchedule = async (
  startDate?: string,
  endDate?: string
): Promise<UserSchedule> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await apiClient.get(`/bookings/my-schedule?${params.toString()}`);
  return response.data;
};

/**
 * Get bookings for a specific room
 */
export const getRoomBookings = async (
  roomId: number,
  startDate?: string,
  endDate?: string,
  status?: 'upcoming' | 'completed' | 'cancelled'
): Promise<Booking[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (status) params.append('status', status);
  
  const response = await apiClient.get(`/bookings/room/${roomId}?${params.toString()}`);
  return response.data;
};

/**
 * Check if a room is available for booking
 */
export const checkAvailability = async (availability: AvailabilityCheck): Promise<boolean> => {
  const response = await apiClient.post('/bookings/check-availability', availability);
  return response.data.available;
};

/**
 * Get booking by ID
 */
export const getBooking = async (bookingId: number): Promise<Booking> => {
  const response = await apiClient.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Create a new booking
 */
export const createBooking = async (booking: BookingCreate): Promise<Booking> => {
  const response = await apiClient.post('/bookings', booking);
  return response.data;
};

/**
 * Update a booking
 */
export const updateBooking = async (bookingId: number, booking: BookingUpdate): Promise<Booking> => {
  const response = await apiClient.put(`/bookings/${bookingId}`, booking);
  return response.data;
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: number): Promise<void> => {
  await apiClient.post(`/bookings/${bookingId}/cancel`);
};

/**
 * Delete a booking
 */
export const deleteBooking = async (bookingId: number): Promise<void> => {
  await apiClient.delete(`/bookings/${bookingId}`);
};
