import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookingCalendar } from "@/components/BookingCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, DollarSign, Clock, Loader2 } from "lucide-react";
import { mockRooms } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Booking = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<string>("1");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const room = mockRooms.find((r) => r.id === roomId);

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-xl text-slate-300">Room not found</p>
          <Button onClick={() => navigate("/rooms")} className="mt-4 bg-amber-500 text-slate-900 hover:bg-amber-400">
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to make a booking",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, navigate, toast]);

  const calculateTotal = () => {
    return room.price * parseInt(duration);
  };

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatTimeForAPI = (time: string, durationHours: number): { start: string; end: string } => {
    // Convert "9:00 AM" to "09:00:00"
    const [timeStr, period] = time.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    // Calculate end time
    const endHours = hours + durationHours;
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    return { start: startTime, end: endTime };
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to make a booking",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsLoading(true);

    try {
      const { start, end } = formatTimeForAPI(selectedTime, parseInt(duration));

      // First check availability
      const availabilityCheck = await api.bookings.checkAvailability({
        room_id: parseInt(roomId!),
        booking_date: formatDateForAPI(selectedDate),
        start_time: start,
        end_time: end,
      });

      if (!availabilityCheck.available) {
        toast({
          title: "Room not available",
          description: "The room is not available for the selected time slot. Please choose another time.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create booking
      const booking = await api.bookings.createBooking({
        room_id: parseInt(roomId!),
        booking_date: formatDateForAPI(selectedDate),
        start_time: start,
        end_time: end,
        participant_ids: [], // Can be extended to add participants
      });

      toast({
        title: "Booking confirmed!",
        description: `Your reservation for ${room.name} has been confirmed.`,
      });

      // Navigate to bookings or home
      navigate("/");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking failed",
        description: error.response?.data?.detail || "Unable to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/rooms")}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rooms
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800/60 border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Book {room.name}</CardTitle>
                <CardDescription className="text-slate-300">{room.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>Capacity: {room.capacity} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span>${room.price}/hour</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <BookingCalendar
              onDateSelect={setSelectedDate}
              onTimeSelect={setSelectedTime}
            />

            <Card className="bg-slate-800/60 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-slate-200">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration" className="bg-slate-700/40 text-white border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600 text-white">
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">Full day (8 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-slate-200">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="bg-slate-700/40 text-white border-slate-600 placeholder-slate-400"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 bg-slate-800/60 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Room</span>
                    <span className="font-medium text-white">{room.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Date</span>
                    <span className="font-medium text-white">
                      {selectedDate ? selectedDate.toLocaleDateString() : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Time</span>
                    <span className="font-medium text-white">{selectedTime || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Duration</span>
                    <span className="font-medium text-white">{duration} hour{duration !== "1" ? "s" : ""}</span>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Room rate</span>
                    <span>${room.price}/hour</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Duration</span>
                    <span>${room.price} × {duration}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-white">Total</span>
                    <span className="text-amber-400">${calculateTotal()}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
                  size="lg"
                  onClick={handleConfirmBooking}
                  disabled={isLoading || !selectedDate || !selectedTime}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>                <p className="text-xs text-slate-400 text-center">
                  By confirming, you agree to our booking terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
