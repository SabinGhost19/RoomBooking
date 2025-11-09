import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Calendar as CalendarIcon,
  DollarSign,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api, { 
  ActivityRequest, 
  EventSuggestionResponse,
  ActivitySuggestion,
  RoomSuggestion 
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Predefined activity types
const ACTIVITY_TYPES = [
  "Team Meeting",
  "Client Meeting", 
  "Workshop",
  "Training Session",
  "Presentation",
  "Brainstorming Session",
  "Sprint Planning",
  "Daily Standup",
  "Retrospective",
  "One-on-One",
  "Interview",
  "Conference Call",
  "Lunch & Learn",
  "Team Building",
  "Custom", // Always keep this last
];

// Available amenities
const AVAILABLE_AMENITIES = [
  "Projector",
  "Whiteboard",
  "Video Conference",
  "WiFi",
  "Power Outlets",
  "Coffee Machine",
  "Climate Control",
  "Soundproof",
  "Natural Light",
  "Storage",
  "Desk",
  "Ergonomic Chair",
  "Billiard Table",
  "Bar Area",
  "Refrigerator",
  "Security",
  "Privacy",
  "Power Backup",
];

// Time slots from 7 AM to 10 PM
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 7;
  return `${hour.toString().padStart(2, '0')}:00`;
});

interface Activity {
  id: string;
  activityType: string;
  customName: string;
  startTime: string;
  endTime: string;
  participantsCount: number;
  selectedAmenities: string[];
  preferences: string;
}

const AIEventPlanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: crypto.randomUUID(),
      activityType: "Team Meeting",
      customName: "",
      startTime: "09:00",
      endTime: "10:00",
      participantsCount: 10,
      selectedAmenities: [],
      preferences: "",
    },
  ]);
  const [generalPreferences, setGeneralPreferences] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isExplicitMode, setIsExplicitMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<EventSuggestionResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Store selected room ID per activity index
  const [selectedRooms, setSelectedRooms] = useState<Map<number, number>>(new Map());
  const [isConfirming, setIsConfirming] = useState(false);

  // Check authentication
  if (!user) {
    navigate("/login");
    return null;
  }

  const addActivity = () => {
    setActivities([
      ...activities,
      {
        id: crypto.randomUUID(),
        activityType: "Team Meeting",
        customName: "",
        startTime: "09:00",
        endTime: "10:00",
        participantsCount: 10,
        selectedAmenities: [],
        preferences: "",
      },
    ]);
  };

  const removeActivity = (id: string) => {
    setActivities(activities.filter((a) => a.id !== id));
  };

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(
      activities.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const toggleAmenity = (activityId: string, amenity: string) => {
    setActivities(activities.map(a => {
      if (a.id === activityId) {
        const selected = a.selectedAmenities.includes(amenity)
          ? a.selectedAmenities.filter(am => am !== amenity)
          : [...a.selectedAmenities, amenity];
        return { ...a, selectedAmenities: selected };
      }
      return a;
    }));
  };

  const getActivityName = (activity: Activity): string => {
    return activity.activityType === "Custom" ? activity.customName : activity.activityType;
  };

  const validateActivities = (): boolean => {
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for your events",
        variant: "destructive",
      });
      return false;
    }

    for (const activity of activities) {
      const activityName = getActivityName(activity);
      if (!activityName || !activity.startTime || !activity.endTime) {
        toast({
          title: "Incomplete activity",
          description: "Please fill in activity name, start time, and end time for all activities",
          variant: "destructive",
        });
        return false;
      }

      // Validate time format and logic
      if (activity.startTime >= activity.endTime) {
        toast({
          title: "Invalid time",
          description: `End time must be after start time for "${activityName}"`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleGetSuggestions = async () => {
    if (!validateActivities()) return;

    setIsLoading(true);
    try {
      const activitiesData: ActivityRequest[] = activities.map((a) => ({
        name: getActivityName(a),
        start_time: a.startTime,
        end_time: a.endTime,
        participants_count: a.participantsCount || undefined,
        required_amenities: a.selectedAmenities.length > 0 ? a.selectedAmenities : [],
        preferences: a.preferences || undefined,
      }));

      const requestData = {
        prompt: `Book rooms for ${activities.length} activities on ${selectedDate!.toISOString().split('T')[0]}`,
        booking_date: selectedDate!.toISOString().split('T')[0],
        activities: activitiesData,
        general_preferences: generalPreferences || undefined,
      };

      const response = await api.eventSuggestions.getSuggestions(requestData);
      setSuggestions(response);
      setShowSuggestions(true);
      
      // Auto-select the recommended room for each activity
      const initialSelections = new Map<number, number>();
      response.suggestions.forEach((suggestion, idx) => {
        initialSelections.set(idx, suggestion.suggested_room.room_id);
      });
      setSelectedRooms(initialSelections);

      toast({
        title: "✨ Suggestions generated!",
        description: `Found ${response.suggestions.length} room suggestions for your activities`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to get suggestions",
        description: error.response?.data?.detail || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectRoomForActivity = (activityIndex: number, roomId: number) => {
    setSelectedRooms(new Map(selectedRooms.set(activityIndex, roomId)));
  };

  const handleConfirmBookings = async () => {
    if (selectedRooms.size === 0) {
      toast({
        title: "No selections",
        description: "Please select at least one room to book",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);
    try {
      const bookingsToConfirm = Array.from(selectedRooms.entries())
        .map(([activityIdx, roomId]) => {
          const suggestion = suggestions!.suggestions[activityIdx];
          return {
            room_id: roomId,
            activity_name: suggestion.activity_name,
            start_time: suggestion.start_time,
            end_time: suggestion.end_time,
            participant_ids: [],
          };
        });

      const confirmData = {
        booking_date: suggestions!.booking_date,
        bookings: bookingsToConfirm,
      };

      const result = await api.eventSuggestions.confirmBulkBookings(confirmData);

      if (result.success_count > 0) {
        toast({
          title: "🎉 Bookings confirmed!",
          description: `Successfully created ${result.success_count} booking(s)`,
        });
        
        if (result.failure_count > 0) {
          toast({
            title: "Some bookings failed",
            description: `${result.failure_count} booking(s) could not be created`,
            variant: "destructive",
          });
        }

        // Navigate to bookings page
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        toast({
          title: "Booking failed",
          description: "Could not create any bookings. Rooms may no longer be available.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to confirm bookings",
        description: error.response?.data?.detail || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const RoomOptionCard = ({ 
    room, 
    isSelected,
    onClick,
  }: { 
    room: RoomSuggestion; 
    isSelected: boolean;
    onClick: () => void;
  }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'border-2 border-amber-500 bg-amber-500/10' 
          : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-amber-500/50'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {isSelected ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-slate-600 mt-1 flex-shrink-0" />
            )}
            <div className="flex-1">
              <CardTitle className="text-lg text-amber-400">{room.room_name}</CardTitle>
              <CardDescription className="mt-1 text-slate-400 text-sm">
                {room.reasoning}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${isSelected ? 'bg-amber-500/20 text-amber-400 border-amber-500' : 'bg-slate-700 text-slate-300'} ml-2 flex-shrink-0`}
          >
            {Math.round(room.confidence_score * 100)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="h-4 w-4 text-amber-400" />
          <span>Capacity: {room.capacity} people</span>
        </div>
        {room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.amenities.map((amenity, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                {amenity}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ActivitySuggestionItem = ({ 
    suggestion, 
    index 
  }: { 
    suggestion: ActivitySuggestion; 
    index: number;
  }) => {
    const selectedRoomId = selectedRooms.get(index);
    const allRooms = [suggestion.suggested_room, ...suggestion.alternative_rooms];
    
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl text-amber-400 flex items-center gap-2">
                {suggestion.activity_name}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {suggestion.start_time} - {suggestion.end_time}
                </span>
                {suggestion.participants_count && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {suggestion.participants_count} people
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3">
              Select a room for this activity:
            </h4>
            <div className="space-y-2">
              {allRooms.map((room, idx) => (
                <RoomOptionCard
                  key={room.room_id}
                  room={room}
                  isSelected={selectedRoomId === room.room_id}
                  onClick={() => selectRoomForActivity(index, room.room_id)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-amber-400" />
            <h1 className="text-4xl font-bold text-white">AI Event Planner</h1>
          </div>
          <p className="text-slate-300 text-lg">
            Let our AI help you find the perfect rooms for your activities
          </p>
        </div>

        {/* Main Form */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left side - Input form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Selection */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Event Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border border-slate-700 bg-slate-900/50"
                />
              </CardContent>
            </Card>

            {/* Activities */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-amber-400">Activities</CardTitle>
                  <Button
                    onClick={addActivity}
                    size="sm"
                    className="bg-amber-500 text-slate-900 hover:bg-amber-400"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Activity
                  </Button>
                </div>
                <CardDescription className="text-slate-400">
                  Define your activities with time slots and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {activities.map((activity, idx) => (
                  <div key={activity.id} className="space-y-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-200">Activity #{idx + 1}</h4>
                      {activities.length > 1 && (
                        <Button
                          onClick={() => removeActivity(activity.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Activity Type Selector */}
                      <div className="md:col-span-2">
                        <Label htmlFor={`type-${activity.id}`} className="text-slate-300">
                          Activity Type *
                        </Label>
                        <Select
                          value={activity.activityType}
                          onValueChange={(value) => updateActivity(activity.id, "activityType", value)}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Select activity type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Custom Name Input (shown only when Custom is selected) */}
                      {activity.activityType === "Custom" && (
                        <div className="md:col-span-2">
                          <Label htmlFor={`custom-name-${activity.id}`} className="text-slate-300">
                            Custom Activity Name *
                          </Label>
                          <Input
                            id={`custom-name-${activity.id}`}
                            placeholder="Enter custom activity name"
                            value={activity.customName}
                            onChange={(e) => updateActivity(activity.id, "customName", e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white"
                          />
                        </div>
                      )}

                      {/* Start Time */}
                      <div>
                        <Label htmlFor={`start-${activity.id}`} className="text-slate-300">
                          Start Time *
                        </Label>
                        <Select
                          value={activity.startTime}
                          onValueChange={(value) => updateActivity(activity.id, "startTime", value)}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 max-h-[200px]">
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time} className="text-white hover:bg-slate-700">
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* End Time */}
                      <div>
                        <Label htmlFor={`end-${activity.id}`} className="text-slate-300">
                          End Time *
                        </Label>
                        <Select
                          value={activity.endTime}
                          onValueChange={(value) => updateActivity(activity.id, "endTime", value)}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 max-h-[200px]">
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time} className="text-white hover:bg-slate-700">
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Number of Participants with Slider */}
                      <div className="md:col-span-2">
                        <Label htmlFor={`participants-${activity.id}`} className="text-slate-300">
                          Number of Participants: <span className="text-amber-400 font-semibold">{activity.participantsCount}</span>
                        </Label>
                        <div className="flex items-center gap-4 mt-2">
                          <Slider
                            id={`participants-${activity.id}`}
                            min={1}
                            max={50}
                            step={1}
                            value={[activity.participantsCount]}
                            onValueChange={(value) => updateActivity(activity.id, "participantsCount", value[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={activity.participantsCount}
                            onChange={(e) => updateActivity(activity.id, "participantsCount", parseInt(e.target.value) || 1)}
                            className="w-20 bg-slate-800 border-slate-600 text-white text-center"
                          />
                        </div>
                      </div>

                      {/* Required Amenities - Multi-select */}
                      <div className="md:col-span-2">
                        <Label className="text-slate-300 mb-2 block">
                          Required Amenities
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-600 max-h-[200px] overflow-y-auto">
                          {AVAILABLE_AMENITIES.map((amenity) => (
                            <div key={amenity} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${activity.id}-${amenity}`}
                                checked={activity.selectedAmenities.includes(amenity)}
                                onCheckedChange={() => toggleAmenity(activity.id, amenity)}
                                className="border-slate-500"
                              />
                              <label
                                htmlFor={`${activity.id}-${amenity}`}
                                className="text-sm text-slate-300 cursor-pointer hover:text-amber-400 transition-colors"
                              >
                                {amenity}
                              </label>
                            </div>
                          ))}
                        </div>
                        {activity.selectedAmenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {activity.selectedAmenities.map((amenity) => (
                              <Badge key={amenity} variant="secondary" className="bg-amber-500/20 text-amber-400">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Additional Preferences */}
                      <div className="md:col-span-2">
                        <Label htmlFor={`prefs-${activity.id}`} className="text-slate-300">
                          Additional Preferences
                        </Label>
                        <Textarea
                          id={`prefs-${activity.id}`}
                          placeholder="Any specific requirements or preferences..."
                          value={activity.preferences}
                          onChange={(e) => updateActivity(activity.id, "preferences", e.target.value)}
                          className="bg-slate-800 border-slate-600 text-white resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right side - General preferences and action */}
          <div className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-amber-400">General Preferences</CardTitle>
                <CardDescription className="text-slate-400">
                  Any overall preferences for all activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g., Prefer rooms close to each other, budget-friendly options, etc."
                  value={generalPreferences}
                  onChange={(e) => setGeneralPreferences(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white resize-none"
                  rows={6}
                />
              </CardContent>
            </Card>

            <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-slate-800/50">
              <CardContent className="pt-6">
                <Button
                  onClick={handleGetSuggestions}
                  disabled={isLoading}
                  className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold text-lg h-12"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Getting AI Suggestions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Get AI Suggestions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Suggestions Dialog */}
        <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-amber-400 flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                AI Suggestions for {selectedDate?.toLocaleDateString()}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Select the bookings you want to confirm. Click on each card to toggle selection.
              </DialogDescription>
            </DialogHeader>

            {suggestions && (
              <div className="space-y-6 py-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-amber-400">
                        {suggestions.suggestions.length}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Activities</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-green-400">
                        {selectedRooms.size}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">Rooms Selected</div>
                    </CardContent>
                  </Card>
                </div>

                {suggestions.overall_notes && (
                  <Card className="border-yellow-500/50 bg-yellow-500/10">
                    <CardContent className="pt-4">
                      <p className="text-yellow-200 text-sm">{suggestions.overall_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Suggestion Cards */}
                <div className="space-y-4">
                  {suggestions.suggestions.map((suggestion, idx) => (
                    <ActivitySuggestionItem key={idx} suggestion={suggestion} index={idx} />
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSuggestions(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBookings}
                disabled={isConfirming || selectedRooms.size === 0}
                className="bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm {selectedRooms.size} Booking(s)
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AIEventPlanner;
