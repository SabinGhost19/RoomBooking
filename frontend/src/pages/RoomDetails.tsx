import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ParticipantSelector from "@/components/ParticipantSelector";
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

    const getBookingCountForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return bookings.filter(b => b.booking_date === dateStr).length;
    };

    const getDayClassName = (date: Date) => {
        const count = getBookingCountForDate(date);
        if (count === 0) return '';

        // Gradual intensity based on booking count
        if (count === 1) return 'bg-amber-500/20 border-amber-500/30 text-amber-200';
        if (count === 2) return 'bg-amber-500/40 border-amber-500/50 text-amber-100';
        if (count === 3) return 'bg-amber-500/60 border-amber-500/70 text-white font-bold';
        if (count >= 4) return 'bg-amber-600/80 border-amber-600 text-white font-extrabold shadow-lg shadow-amber-500/40';

        return '';
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
                                                <div className="flex items-center gap-2">
                                                    {booking.approval_status === 'pending' && (
                                                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                    {booking.approval_status === 'approved' && (
                                                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                                            Approved
                                                        </Badge>
                                                    )}
                                                    {booking.approval_status === 'rejected' && (
                                                        <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30">
                                                            Rejected
                                                        </Badge>
                                                    )}
                                                    <Badge className="bg-amber-500 text-slate-900 font-bold">Booked</Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Booking Form */}
                    <div className="lg:col-span-1">
                        <Card className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95 border border-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/10 sticky top-20">
                            <CardHeader className="pb-4 border-b border-amber-500/20">
                                <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/30">
                                        <CalendarIcon className="h-5 w-5 text-slate-900" />
                                    </div>
                                    Book this Room
                                </CardTitle>
                                <p className="text-slate-400 text-sm mt-2">Select your preferred date and time</p>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {/* Calendar Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-amber-400 text-sm font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            Select Date
                                        </Label>
                                        <span className="text-xs text-slate-400">
                                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="p-4 bg-slate-700/30 rounded-2xl border border-amber-500/20 shadow-inner">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => date && setSelectedDate(date)}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            modifiers={{
                                                booked1: (date) => getBookingCountForDate(date) === 1,
                                                booked2: (date) => getBookingCountForDate(date) === 2,
                                                booked3: (date) => getBookingCountForDate(date) === 3,
                                                booked4plus: (date) => getBookingCountForDate(date) >= 4,
                                            }}
                                            modifiersClassNames={{
                                                booked1: 'rdp-day-booked1',
                                                booked2: 'rdp-day-booked2',
                                                booked3: 'rdp-day-booked3',
                                                booked4plus: 'rdp-day-booked4plus',
                                            }}
                                            className="mx-auto
                                            [&_.rdp-months]:flex [&_.rdp-months]:justify-center [&_.rdp-months]:w-full
                                            [&_.rdp-month]:w-full [&_.rdp-month]:max-w-[300px]
                                            [&_.rdp-caption]:flex [&_.rdp-caption]:items-center [&_.rdp-caption]:justify-center [&_.rdp-caption]:mb-5 [&_.rdp-caption]:relative [&_.rdp-caption]:px-2
                                            [&_.rdp-caption_label]:text-amber-400 [&_.rdp-caption_label]:font-bold [&_.rdp-caption_label]:text-lg [&_.rdp-caption_label]:tracking-wide
                                            [&_.rdp-nav]:flex [&_.rdp-nav]:gap-2 [&_.rdp-nav]:absolute [&_.rdp-nav]:w-full [&_.rdp-nav]:justify-between [&_.rdp-nav]:px-2
                                            [&_.rdp-nav_button]:h-10 [&_.rdp-nav_button]:w-10 [&_.rdp-nav_button]:rounded-xl [&_.rdp-nav_button]:border-2 [&_.rdp-nav_button]:border-amber-500/40 [&_.rdp-nav_button]:bg-gradient-to-br [&_.rdp-nav_button]:from-slate-700/80 [&_.rdp-nav_button]:to-slate-800/80 [&_.rdp-nav_button]:text-amber-400 [&_.rdp-nav_button:hover]:bg-gradient-to-br [&_.rdp-nav_button:hover]:from-amber-500/30 [&_.rdp-nav_button:hover]:to-amber-600/30 [&_.rdp-nav_button:hover]:border-amber-400/70 [&_.rdp-nav_button:hover]:scale-110 [&_.rdp-nav_button]:transition-all [&_.rdp-nav_button]:duration-300 [&_.rdp-nav_button]:shadow-xl [&_.rdp-nav_button:hover]:shadow-amber-500/40
                                            [&_.rdp-head_cell]:text-amber-400/80 [&_.rdp-head_cell]:font-bold [&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:uppercase [&_.rdp-head_cell]:tracking-widest [&_.rdp-head_cell]:pb-3 [&_.rdp-head_cell]:w-[42px]
                                            [&_.rdp-table]:w-full [&_.rdp-table]:table-fixed
                                            [&_.rdp-cell]:p-0.5 [&_.rdp-cell]:text-center
                                            [&_.rdp-button]:h-[42px] [&_.rdp-button]:w-[42px] [&_.rdp-button]:rounded-xl [&_.rdp-button]:text-white/90 [&_.rdp-button]:font-semibold [&_.rdp-button]:text-base [&_.rdp-button]:transition-all [&_.rdp-button]:duration-300 [&_.rdp-button]:border-2 [&_.rdp-button]:border-transparent [&_.rdp-button]:mx-auto [&_.rdp-button]:flex [&_.rdp-button]:items-center [&_.rdp-button]:justify-center
                                            [&_.rdp-button:hover]:bg-gradient-to-br [&_.rdp-button:hover]:from-amber-500/30 [&_.rdp-button:hover]:to-amber-600/20 [&_.rdp-button:hover]:text-amber-200 [&_.rdp-button:hover]:scale-110 [&_.rdp-button:hover]:shadow-2xl [&_.rdp-button:hover]:shadow-amber-500/50 [&_.rdp-button:hover]:border-amber-400/60 [&_.rdp-button:hover]:font-bold [&_.rdp-button:hover]:z-10
                                            [&_.rdp-day_selected]:!bg-gradient-to-br [&_.rdp-day_selected]:!from-amber-400 [&_.rdp-day_selected]:!via-amber-500 [&_.rdp-day_selected]:!to-amber-600 [&_.rdp-day_selected]:!text-slate-900 [&_.rdp-day_selected]:!font-extrabold [&_.rdp-day_selected]:!text-lg [&_.rdp-day_selected]:!shadow-2xl [&_.rdp-day_selected]:!shadow-amber-500/70 [&_.rdp-day_selected]:!scale-[1.15] [&_.rdp-day_selected]:!border-amber-300 [&_.rdp-day_selected]:!ring-4 [&_.rdp-day_selected]:!ring-amber-400/60 [&_.rdp-day_selected]:!ring-offset-2 [&_.rdp-day_selected]:!ring-offset-slate-800 [&_.rdp-day_selected]:!z-20
                                            [&_.rdp-day_today]:bg-gradient-to-br [&_.rdp-day_today]:from-green-400 [&_.rdp-day_today]:via-lime-400 [&_.rdp-day_today]:to-yellow-400 [&_.rdp-day_today]:text-slate-900 [&_.rdp-day_today]:font-extrabold [&_.rdp-day_today]:border-2 [&_.rdp-day_today]:border-green-500 [&_.rdp-day_today]:shadow-2xl [&_.rdp-day_today]:shadow-green-500/60 [&_.rdp-day_today]:ring-4 [&_.rdp-day_today]:ring-green-400/50 [&_.rdp-day_today]:ring-offset-2 [&_.rdp-day_today]:ring-offset-slate-800 [&_.rdp-day_today]:animate-pulse
                                            [&_.rdp-day_outside]:text-white/15 [&_.rdp-day_outside]:opacity-20 [&_.rdp-day_outside:hover]:opacity-30
                                            [&_.rdp-day_disabled]:text-slate-700 [&_.rdp-day_disabled]:opacity-20 [&_.rdp-day_disabled]:cursor-not-allowed [&_.rdp-day_disabled:hover]:scale-100 [&_.rdp-day_disabled:hover]:bg-transparent [&_.rdp-day_disabled:hover]:shadow-none [&_.rdp-day_disabled]:line-through"
                                        />
                                    </div>

                                    {/* Booking Intensity Legend */}
                                    <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-amber-500/20">
                                        <p className="text-xs text-amber-400 font-semibold mb-2">Booking Intensity:</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30"></div>
                                                <span className="text-slate-300">1 booking</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-amber-500/40 border border-amber-500/50"></div>
                                                <span className="text-slate-300">2 bookings</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-amber-500/60 border border-amber-500/70"></div>
                                                <span className="text-slate-300">3 bookings</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-amber-600/80 border border-amber-600 shadow-md"></div>
                                                <span className="text-slate-300">4+ bookings</span>
                                            </div>
                                        </div>
                                    </div>
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

                                {/* Participant Selector */}
                                {room.capacity > 1 && (
                                    <div className="space-y-2">
                                        <ParticipantSelector
                                            selectedParticipants={selectedParticipants}
                                            onParticipantsChange={setSelectedParticipants}
                                            maxParticipants={room.capacity - 1} // -1 for the organizer
                                            currentUserId={user?.id}
                                            disabled={submitting}
                                        />
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
