import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Users, DollarSign, ArrowLeft, Clock, Calendar as CalendarIcon,
    Loader2, CheckCircle2
} from "lucide-react";
import { getRoom, getRoomBookings, createBooking, Room, Booking } from "@/lib/roomsApi";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const RoomDetails = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [room, setRoom] = useState<Room | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState<string>("09:00");
    const [endTime, setEndTime] = useState<string>("10:00");
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Generate time slots from 7:00 to 22:00
    const timeSlots = Array.from({ length: 15 }, (_, i) => {
        const hour = i + 7;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    useEffect(() => {
        if (roomId) {
            fetchRoomDetails();
        }
    }, [roomId]);

    useEffect(() => {
        if (roomId && selectedDate) {
            fetchBookings();
        }
    }, [roomId, selectedDate]);

    const fetchRoomDetails = async () => {
        try {
            setLoading(true);
            const data = await getRoom(Number(roomId));
            setRoom(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to fetch room details",
                variant: "destructive",
            });
            navigate('/rooms');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookings = async () => {
        try {
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(selectedDate);
            endDate.setDate(endDate.getDate() + 21); // 3 weeks

            const data = await getRoomBookings(
                Number(roomId),
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                'upcoming'
            );
            setBookings(data);
        } catch (error: any) {
            console.error('Failed to fetch bookings:', error);
        }
    };

    const handleBooking = async () => {
        if (!room || !selectedDate) return;

        try {
            setSubmitting(true);

            const bookingDate = selectedDate.toISOString().split('T')[0];

            await createBooking({
                room_id: room.id,
                booking_date: bookingDate,
                start_time: startTime,
                end_time: endTime,
                participant_ids: selectedParticipants,
            });

            toast({
                title: "Success",
                description: "Room booked successfully!",
            });

            // Refresh bookings
            await fetchBookings();

            // Reset form
            setSelectedParticipants([]);

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to book room",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getBookingsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return bookings.filter(b => b.booking_date === dateStr);
    };

    const isTimeSlotAvailable = (time: string) => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => b.booking_date === dateStr);

        // Check if the time slot conflicts with any existing booking
        return !todayBookings.some(booking => {
            const bookingStart = booking.start_time.substring(0, 5);
            const bookingEnd = booking.end_time.substring(0, 5);
            return time >= bookingStart && time < bookingEnd;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex items-center justify-center">
                <Card className="bg-slate-800/60 border-white/10">
                    <CardContent className="p-8">
                        <p className="text-white">Room not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
            <div className="container mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    className="mb-6 text-white hover:text-amber-500"
                    onClick={() => navigate('/rooms')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Rooms
                </Button>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Room Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-slate-800/60 border-white/10">
                            <div className="relative h-64 overflow-hidden rounded-t-lg">
                                <img
                                    src={room.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'}
                                    alt={room.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-3xl text-white">{room.name}</CardTitle>
                                    {room.is_available ? (
                                        <Badge className="bg-amber-500 text-slate-900">Available</Badge>
                                    ) : (
                                        <Badge variant="secondary">Unavailable</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-slate-300">{room.description || 'No description available'}</p>

                                <div className="flex items-center gap-6 text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-amber-500" />
                                        <span className="font-semibold">{room.capacity}</span>
                                        <span>people</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-amber-500" />
                                        <span className="font-semibold">${room.price}</span>
                                        <span>/hour</span>
                                    </div>
                                </div>

                                {room.amenities && room.amenities.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-3">Amenities</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {room.amenities.map((amenity) => (
                                                <Badge
                                                    key={amenity}
                                                    variant="outline"
                                                    className="bg-amber-500/10 text-amber-400 border-amber-500/30"
                                                >
                                                    {amenity}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bookings Schedule */}
                        <Card className="bg-slate-800/60 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Room Schedule</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {getBookingsForDate(selectedDate).length === 0 ? (
                                        <p className="text-slate-400">No bookings for this day</p>
                                    ) : (
                                        getBookingsForDate(selectedDate).map((booking) => (
                                            <div
                                                key={booking.id}
                                                className="flex items-center justify-between p-3 bg-slate-700/40 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Clock className="h-4 w-4 text-amber-500" />
                                                    <span className="text-white">
                                                        {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                                                    </span>
                                                </div>
                                                <Badge variant="secondary">Booked</Badge>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Form */}
                    <div className="lg:col-span-1">
                        <Card className="bg-slate-800/60 border-white/10 sticky top-20">
                            <CardHeader>
                                <CardTitle className="text-white">Book this Room</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-200">Select Date</Label>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        className="rounded-md border border-slate-600 bg-slate-700/40"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-200">Start Time</Label>
                                    <Select value={startTime} onValueChange={setStartTime}>
                                        <SelectTrigger className="bg-slate-700/40 text-white border-slate-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-600">
                                            {timeSlots.map((time) => (
                                                <SelectItem
                                                    key={time}
                                                    value={time}
                                                    disabled={!isTimeSlotAvailable(time)}
                                                    className="text-white"
                                                >
                                                    {time} {!isTimeSlotAvailable(time) && '(Booked)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-200">End Time</Label>
                                    <Select value={endTime} onValueChange={setEndTime}>
                                        <SelectTrigger className="bg-slate-700/40 text-white border-slate-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-600">
                                            {timeSlots.filter(time => time > startTime).map((time) => (
                                                <SelectItem key={time} value={time} className="text-white">
                                                    {time}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {room.capacity > 1 && (
                                    <div className="space-y-2">
                                        <Label className="text-slate-200">
                                            Additional Participants (Optional)
                                        </Label>
                                        <p className="text-xs text-slate-400">
                                            Room capacity: {room.capacity} people
                                        </p>
                                        {/* Note: In a real app, you'd fetch and display a list of users here */}
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold"
                                    onClick={handleBooking}
                                    disabled={!room.is_available || submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Confirm Booking
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomDetails;
