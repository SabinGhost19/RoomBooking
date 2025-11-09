import { useState, useEffect } from "react";
import { Calendar, Clock, Sparkles, TrendingDown, Users, Beer, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ParticipantSelector from "@/components/ParticipantSelector";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/lib/api";

interface BookingAnalysis {
  date: string;
  total_bookings: number;
  occupied_hours: number[];
  available_hours: number[];
}

interface EventSuggestion {
  suggested_date: string;
  suggested_time: string;
  event_title: string;
  event_description: string;
  reasoning: string;
  booking_analysis: BookingAnalysis[];
}

const SuggestEvent = () => {
  const [suggestion, setSuggestion] = useState<EventSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [inviteAllUsers, setInviteAllUsers] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchEventSuggestion();
  }, []);

  const fetchEventSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/events/suggest-event");
      setSuggestion(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch event suggestion";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const handleCreateBooking = async () => {
    if (!suggestion) return;

    try {
      setCreatingBooking(true);

      // Get all users if "Invite All" is checked
      let participantIds = selectedParticipants;
      if (inviteAllUsers) {
        const allUsers = await userAPI.getAllUsers({ limit: 500 });
        // Exclude current user
        participantIds = allUsers
          .filter(u => u.id !== user?.id)
          .map(u => u.id);
      }

      // Parse suggested time to get start and end times
      const timeMatch = suggestion.suggested_time.match(/(\d{1,2}):(\d{2})/);
      const startHour = timeMatch ? parseInt(timeMatch[1]) : 18;
      const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(startHour + 2).toString().padStart(2, '0')}:00:00`; // 2 hour event

      // Find BeerPoint room ID
      const roomsResponse = await apiClient.get('/rooms/', {
        params: { search: 'BeerPoint', limit: 1 }
      });
      const beerPointRoom = roomsResponse.data[0];
      
      if (!beerPointRoom) {
        throw new Error('BeerPoint room not found');
      }

      const response = await apiClient.post('/bookings/', {
        room_id: beerPointRoom.id,
        booking_date: suggestion.suggested_date,
        start_time: startTime,
        end_time: endTime,
        participant_ids: participantIds,
      });

      toast({
        title: "Event Created!",
        description: `${suggestion.event_title} has been scheduled for ${formatDate(suggestion.suggested_date)}. ${participantIds.length > 0 ? `Invitations sent to ${participantIds.length} participant(s).` : ''}`,
      });

      setDialogOpen(false);
      setSelectedParticipants([]);
      setInviteAllUsers(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <Alert variant="destructive" className="bg-red-900/50 border-red-500">
            <AlertTitle>Error Loading Suggestion</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchEventSuggestion} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Sparkles className="h-10 w-10 text-amber-400" />
              AI Event Suggestion
            </h1>
            <p className="text-slate-300 mt-2">
              Smart recommendations based on team availability
            </p>
          </div>
          <Button 
            onClick={fetchEventSuggestion} 
            className="bg-amber-500 hover:bg-amber-400 text-slate-900"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Refresh Suggestion
          </Button>
        </div>

        {/* Main Suggestion Card */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-none shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Beer className="h-8 w-8 text-slate-900" />
              <div>
                <CardTitle className="text-3xl text-slate-900">{suggestion.event_title}</CardTitle>
                <CardDescription className="text-slate-800 text-lg mt-2">
                  {suggestion.event_description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-900/20 p-4 rounded-lg">
                <Calendar className="h-6 w-6 text-slate-900" />
                <div>
                  <p className="text-sm text-slate-800 font-medium">Suggested Date</p>
                  <p className="text-lg font-bold text-slate-900">{formatDate(suggestion.suggested_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-900/20 p-4 rounded-lg">
                <Clock className="h-6 w-6 text-slate-900" />
                <div>
                  <p className="text-sm text-slate-800 font-medium">Suggested Time</p>
                  <p className="text-lg font-bold text-slate-900">{suggestion.suggested_time}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/20 p-4 rounded-lg">
              <p className="text-sm text-slate-800 font-medium mb-2">AI Reasoning</p>
              <p className="text-slate-900">{suggestion.reasoning}</p>
            </div>
          </CardContent>
        </Card>

        {/* Booking Analysis Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-amber-400" />
            Next 7 Days Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suggestion.booking_analysis.map((day, index) => {
              const isSelectedDay = day.date === suggestion.suggested_date;
              return (
                <Card 
                  key={index}
                  className={`${
                    isSelectedDay 
                      ? 'bg-gradient-to-br from-green-600 to-green-700 border-green-400' 
                      : 'bg-slate-800/60 border-white/10'
                  } transition-all hover:scale-105`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg ${isSelectedDay ? 'text-white' : 'text-white'}`}>
                        {getDayName(day.date)}
                      </CardTitle>
                      {isSelectedDay && (
                        <Badge className="bg-amber-400 text-slate-900">Best Day</Badge>
                      )}
                    </div>
                    <CardDescription className={isSelectedDay ? 'text-green-100' : 'text-slate-400'}>
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isSelectedDay ? 'text-green-100' : 'text-slate-300'}`}>
                        Bookings
                      </span>
                      <Badge variant={isSelectedDay ? "secondary" : "outline"} className={isSelectedDay ? 'bg-green-800 text-white' : ''}>
                        {day.total_bookings}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className={`text-xs ${isSelectedDay ? 'text-green-100' : 'text-slate-400'} mb-1`}>
                        Available Hours
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {day.available_hours.length > 0 ? (
                          day.available_hours.map((hour) => (
                            <Badge 
                              key={hour} 
                              variant="outline" 
                              className={`text-xs ${
                                isSelectedDay 
                                  ? 'bg-green-800/50 border-green-300 text-white' 
                                  : 'bg-slate-700/50 border-slate-500 text-slate-300'
                              }`}
                            >
                              {hour}:00
                            </Badge>
                          ))
                        ) : (
                          <span className={`text-xs ${isSelectedDay ? 'text-green-200' : 'text-slate-500'}`}>
                            Fully booked
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-slate-800/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" />
              Ready to Create This Event?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              This event will be held at the <strong className="text-amber-400">BeerPoint</strong> room. 
              Would you like to create a booking for this event?
            </p>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-slate-800 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl">
                    Create Event Booking
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {suggestion?.event_title} - {suggestion && formatDate(suggestion.suggested_date)} at {suggestion?.suggested_time}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Event Details */}
                  <div className="space-y-2">
                    <Label className="text-slate-200">Event Details</Label>
                    <div className="p-4 bg-slate-700/30 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span className="text-slate-300">
                          {suggestion && formatDate(suggestion.suggested_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span className="text-slate-300">{suggestion?.suggested_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Beer className="h-4 w-4 text-amber-400" />
                        <span className="text-slate-300">BeerPoint Room</span>
                      </div>
                    </div>
                  </div>

                  {/* Invite All Users Option */}
                  <div className="flex items-center space-x-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <Checkbox
                      id="inviteAll"
                      checked={inviteAllUsers}
                      onCheckedChange={(checked) => {
                        setInviteAllUsers(checked as boolean);
                        if (checked) {
                          setSelectedParticipants([]);
                        }
                      }}
                      className="border-amber-500 data-[state=checked]:bg-amber-500"
                    />
                    <label
                      htmlFor="inviteAll"
                      className="text-sm font-medium text-amber-400 cursor-pointer flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Invite ALL Users (Company-wide Event)
                    </label>
                  </div>

                  {/* Participant Selector (disabled if Invite All is checked) */}
                  {!inviteAllUsers && (
                    <div>
                      <ParticipantSelector
                        selectedParticipants={selectedParticipants}
                        onParticipantsChange={setSelectedParticipants}
                        currentUserId={user?.id}
                        disabled={creatingBooking}
                      />
                    </div>
                  )}

                  {inviteAllUsers && (
                    <Alert className="bg-amber-500/10 border-amber-500/30">
                      <Users className="h-4 w-4 text-amber-400" />
                      <AlertTitle className="text-amber-400">Company-wide Event</AlertTitle>
                      <AlertDescription className="text-slate-300">
                        All users in the system will receive an invitation for this event.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={creatingBooking}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBooking}
                    disabled={creatingBooking}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900"
                  >
                    {creatingBooking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Event Booking
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuggestEvent;
