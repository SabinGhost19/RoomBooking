export interface Room {
  id: string;
  name: string;
  capacity: number;
  price: number;
  amenities: string[];
  image: string;
  available: boolean;
  description: string;
  svgId?: string; // ID of the polygon in the SVG floor plan
  coordinates?: { x: number; y: number }; // Center coordinates for positioning
}

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export const mockRooms: Room[] = [
  {
    id: '1',
    name: 'Executive Meeting Room',
    capacity: 12,
    price: 75,
    amenities: ['Projector', 'Whiteboard', 'Video Conference', 'Coffee'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    available: true,
    description: 'Perfect for team meetings and presentations',
    svgId: 'room-1',
    coordinates: { x: 200, y: 150 }
  },
  {
    id: '2',
    name: 'Creative Studio',
    capacity: 8,
    price: 60,
    amenities: ['Natural Light', 'Whiteboard', 'Smart TV', 'Plants'],
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
    available: true,
    description: 'Inspiring space for creative brainstorming',
    svgId: 'room-2',
    coordinates: { x: 400, y: 150 }
  },
  {
    id: '3',
    name: 'Private Office',
    capacity: 4,
    price: 45,
    amenities: ['Standing Desk', 'Monitor', 'Coffee Machine', 'Quiet'],
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
    available: true,
    description: 'Quiet space for focused work',
    svgId: 'room-3',
    coordinates: { x: 200, y: 350 }
  },
  {
    id: '4',
    name: 'Conference Hall',
    capacity: 30,
    price: 150,
    amenities: ['Stage', 'PA System', 'Projector', 'Catering Space'],
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800',
    available: false,
    description: 'Large venue for conferences and events',
    svgId: 'room-4',
    coordinates: { x: 400, y: 350 }
  },
  {
    id: '5',
    name: 'Collaboration Zone',
    capacity: 6,
    price: 50,
    amenities: ['Whiteboard', 'Comfortable Seating', 'WiFi', 'Plants'],
    image: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800',
    available: true,
    description: 'Casual space for team collaboration',
    svgId: 'room-5',
    coordinates: { x: 600, y: 150 }
  },
  {
    id: '6',
    name: 'Board Room',
    capacity: 16,
    price: 100,
    amenities: ['Executive Seating', '4K Display', 'Video Conference', 'Privacy'],
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800',
    available: true,
    description: 'Premium space for important meetings',
    svgId: 'room-6',
    coordinates: { x: 600, y: 350 }
  },
  {
    id: '7',
    name: 'Beer Point',
    capacity: 20,
    price: 0,
    amenities: ['Beer Tap', 'Seating', 'Social Area', 'Relaxation'],
    image: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=800',
    available: true,
    description: 'Relaxation area with beer on tap',
    svgId: 'path266',
    coordinates: { x: 331.5, y: 115.5 }
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    roomId: '1',
    roomName: 'Executive Meeting Room',
    date: '2025-11-15',
    startTime: '10:00',
    endTime: '12:00',
    status: 'upcoming'
  },
  {
    id: 'b2',
    roomId: '3',
    roomName: 'Private Office',
    date: '2025-11-18',
    startTime: '14:00',
    endTime: '17:00',
    status: 'upcoming'
  },
  {
    id: 'b3',
    roomId: '2',
    roomName: 'Creative Studio',
    date: '2025-11-05',
    startTime: '09:00',
    endTime: '11:00',
    status: 'completed'
  }
];

export const mockUser = {
  name: 'Sarah Johnson',
  email: 'sarah.j@company.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  bookings: mockBookings.length,
  totalHours: 24
};
