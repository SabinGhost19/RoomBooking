import { useState, useEffect } from "react";
import { FloorPlanWithObjects } from "@/components/FloorPlanWithObjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createBooking, getRooms, checkAvailability } from "@/lib/roomsApi";

const View2DMap = () => {
    const { toast } = useToast();
    const { user } = useAuth();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState<string>("09:00");
    const [endTime, setEndTime] = useState<string>("10:00");
    const [occupiedRooms, setOccupiedRooms] = useState<Set<number>>(new Set());
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Generate time slots from 7:00 to 22:00
    const timeSlots = Array.from({ length: 15 }, (_, i) => {
        const hour = i + 7;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    // Check availability when date or time changes
    useEffect(() => {
        checkRoomAvailability();
    }, [selectedDate, startTime, endTime]);

    const checkRoomAvailability = async () => {
        try {
            setCheckingAvailability(true);
            
            // Get all rooms
            const rooms = await getRooms({ limit: 500 });
            
            const bookingDate = selectedDate.toISOString().split('T')[0];
            const occupied = new Set<number>();

            // Format times with seconds for backend
            const startTimeFormatted = `${startTime}:00`;
            const endTimeFormatted = `${endTime}:00`;

            // Check each room's availability
            for (const room of rooms) {
                try {
                    const isAvailable = await checkAvailability({
                        room_id: room.id,
                        booking_date: bookingDate,
                        start_time: startTimeFormatted,
                        end_time: endTimeFormatted,
                    });
                    
                    if (!isAvailable) {
                        occupied.add(room.id);
                    }
                } catch (error) {
                    console.error(`Failed to check availability for room ${room.id}:`, error);
                }
            }

            setOccupiedRooms(occupied);
            console.log('🔴 Occupied rooms:', Array.from(occupied));
            
        } catch (error) {
            console.error('Failed to check room availability:', error);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleQuickBooking = async (roomId: number) => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please login to book a room",
                variant: "destructive",
            });
            return;
        }

        // Check if room is occupied
        if (occupiedRooms.has(roomId)) {
            toast({
                title: "Room Unavailable",
                description: "This room is occupied during the selected time slot",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            setSelectedRoomForBooking(roomId);

            const bookingDate = selectedDate.toISOString().split('T')[0];
            
            // Format times with seconds
            const startTimeFormatted = `${startTime}:00`;
            const endTimeFormatted = `${endTime}:00`;

            console.log('📝 Creating booking:', {
                room_id: roomId,
                booking_date: bookingDate,
                start_time: startTimeFormatted,
                end_time: endTimeFormatted,
            });

            await createBooking({
                room_id: roomId,
                booking_date: bookingDate,
                start_time: startTimeFormatted,
                end_time: endTimeFormatted,
            });

            toast({
                title: "Success",
                description: "Room booked successfully!",
            });

            // Refresh availability
            await checkRoomAvailability();

        } catch (error: any) {
            console.error('❌ Booking error:', error);
            console.error('   Error details:', error.response?.data);
            
            // Parse error message to provide better feedback
            let errorTitle = "Booking Failed";
            let errorMessage = "Failed to book room";
            
            if (error.response?.data?.detail) {
                const detail = error.response.data.detail.toLowerCase();
                
                // Check if it's a user availability conflict
                if (detail.includes("participants unavailable") || 
                    detail.includes("unavailable") || 
                    detail.includes("organizer") ||
                    detail.includes("user") && detail.includes("occupied")) {
                    errorTitle = "You Already Have a Booking";
                    errorMessage = `You already have a reservation during ${startTime} - ${endTime}. You cannot book multiple rooms at the same time.`;
                } 
                // Check if room is occupied
                else if (detail.includes("room may be occupied") || 
                         detail.includes("room") && detail.includes("occupied")) {
                    errorTitle = "Room Occupied";
                    errorMessage = `This room is already booked for ${startTime} - ${endTime}. Please choose a different time or room.`;
                } 
                // Check capacity issues
                else if (detail.includes("capacity exceeded") || detail.includes("capacity")) {
                    errorTitle = "Capacity Exceeded";
                    errorMessage = "The room capacity has been exceeded for this booking.";
                } 
                // Generic error
                else {
                    errorMessage = error.response.data.detail;
                }
            }
            
            toast({
                title: errorTitle,
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
            setSelectedRoomForBooking(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex flex-col">
            {/* Keep original navbar */}
            <Navbar />

            <div className="container mx-auto px-4 py-6 flex-1">
                {/* Booking Controls */}
                <Card className="bg-slate-800/60 border-white/10 mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
                            {/* Date Picker */}
                            <div className="space-y-2">
                                <Label className="text-slate-200 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-amber-500" />
                                    Select Date
                                </Label>
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    className="rounded-md border border-slate-600 bg-slate-700/40"
                                />
                            </div>

                            {/* Time Selection */}
                            <div className="flex-1 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-200 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            Start Time
                                        </Label>
                                        <Select value={startTime} onValueChange={setStartTime}>
                                            <SelectTrigger className="bg-slate-700/40 text-white border-slate-600">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-600">
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time} value={time} className="text-white">
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-200 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            End Time
                                        </Label>
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
                                </div>

                                {/* Status Info */}
                                <div className="flex items-center justify-between p-4 bg-slate-700/40 rounded-lg border border-slate-600">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                                            <span className="text-sm text-slate-300">Available</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-red-500/80 rounded" 
                                                 style={{
                                                     backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)'
                                                 }}>
                                            </div>
                                            <span className="text-sm text-slate-300">Occupied</span>
                                        </div>
                                    </div>
                                    {checkingAvailability && (
                                        <div className="flex items-center gap-2 text-amber-400">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm">Checking availability...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-xs text-slate-400 bg-slate-700/30 p-3 rounded border border-slate-600">
                                    💡 <strong>Tip:</strong> Hover over rooms to see details. Click "Quick Book" on available rooms 
                                    or "View Details & Book" for more information.
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Floor Plan - Smaller and centered */}
                <div className="bg-slate-800/60 border border-white/10 rounded-lg p-4 shadow-2xl">
                    <div className="h-[600px] relative">
                        <FloorPlanWithObjects
                            imageSrc="/plan_IMAGE.jpg"
                            svgObjectsSrc="/OBJECTS.svg"
                            className="w-full h-full"
                            occupiedRoomIds={occupiedRooms}
                            onQuickBooking={handleQuickBooking}
                            selectedDate={selectedDate}
                            startTime={startTime}
                            endTime={endTime}
                            isSubmitting={submitting}
                            selectedRoomId={selectedRoomForBooking}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default View2DMap;
