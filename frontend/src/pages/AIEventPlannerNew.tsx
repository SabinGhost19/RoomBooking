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
  Lightbulb,
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
  "Custom",
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

const AIEventPlannerNew = () => {
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
    if (activities.length > 1) {
      setActivities(activities.filter((a) => a.id !== id));
    }
  };

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(
      activities.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const toggleAmenity = (activityId: string, amenity: string) => {
    setActivities(
      activities.map((a) =>
        a.id === activityId
          ? {
              ...a,
              selectedAmenities: a.selectedAmenities.includes(amenity)
                ? a.selectedAmenities.filter((am) => am !== amenity)
                : [...a.selectedAmenities, amenity],
            }
          : a
      )
    );
  };

  const handleGetSuggestions = async () => {
    // Validate prompt is not empty
    if (!aiPrompt || aiPrompt.trim() === "") {
      toast({
        title: "Prompt Required",
        description: "Please describe what you need to book",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Build request based on mode
      let requestData: any = {
        prompt: aiPrompt,
        general_preferences: generalPreferences || undefined,
      };

      // If explicit mode is enabled, include activities and date
      if (isExplicitMode) {
        if (!selectedDate) {
          toast({
            title: "Date Required",
            description: "Please select a date when using detailed mode",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (activities.length === 0) {
          toast({
            title: "Activities Required",
            description: "Please add at least one activity in detailed mode",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const activitiesPayload: ActivityRequest[] = activities.map((activity) => ({
          name: activity.activityType === "Custom" && activity.customName 
            ? activity.customName 
            : activity.activityType,
          start_time: activity.startTime,
          end_time: activity.endTime,
          participants_count: activity.participantsCount > 0 ? activity.participantsCount : undefined,
          required_amenities: activity.selectedAmenities.length > 0 ? activity.selectedAmenities : undefined,
          preferences: activity.preferences || undefined,
        }));

        // Format date correctly without timezone conversion
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        requestData.booking_date = `${year}-${month}-${day}`;
        requestData.activities = activitiesPayload;
      } else {
        // Prompt-only mode: optionally include date if selected
        if (selectedDate) {
          // Format date correctly without timezone conversion
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          requestData.booking_date = `${year}-${month}-${day}`;
        }
        // Do NOT include activities - let AI parse from prompt
      }

      const response = await api.eventSuggestions.getSuggestions(requestData);

      setSuggestions(response);
      
      // Auto-select suggested rooms
      const initialSelections = new Map<number, number>();
      response.suggestions.forEach((suggestion, index) => {
        initialSelections.set(index, suggestion.suggested_room.room_id);
      });
      setSelectedRooms(initialSelections);
      
      setShowSuggestions(true);

      toast({
        title: "Suggestions Ready!",
        description: `Found ${response.suggestions.length} room suggestions for your activities`,
      });
    } catch (error: any) {
      console.error("Error getting suggestions:", error);
      console.error("Error response data:", error.response?.data);
      
      let errorMessage = "Failed to get AI suggestions";
      
      // Check for timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = "Request timed out. The AI is taking longer than expected. Please try again.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRoomSelection = (activityIndex: number, roomId: number) => {
    setSelectedRooms((prev) => {
      const newMap = new Map(prev);
      if (newMap.get(activityIndex) === roomId) {
        newMap.delete(activityIndex);
      } else {
        newMap.set(activityIndex, roomId);
      }
      return newMap;
    });
  };

  const handleConfirmBookings = async () => {
    if (!selectedDate || !suggestions) return;

    if (selectedRooms.size === 0) {
      toast({
        title: "No Rooms Selected",
        description: "Please select at least one room to book",
        variant: "destructive",
      });
      return;
    }

    setIsConfirming(true);

    try {
      const bookingsToConfirm = Array.from(selectedRooms.entries()).map(([activityIndex, roomId]) => {
        const suggestion = suggestions.suggestions[activityIndex];
        return {
          room_id: roomId,
          start_time: suggestion.start_time,
          end_time: suggestion.end_time,
          activity_name: suggestion.activity_name,
          participant_ids: suggestion.participants_count ? [] : undefined,
        };
      });

      const response = await api.eventSuggestions.confirmBulkBookings({
        booking_date: selectedDate.toISOString().split("T")[0],
        bookings: bookingsToConfirm,
      });

      if (response.success_count > 0) {
        toast({
          title: "Success!",
          description: `Created ${response.success_count} booking(s) successfully`,
        });
      }

      if (response.failure_count > 0) {
        toast({
          title: "Partial Success",
          description: `${response.failure_count} booking(s) failed. Check details.`,
          variant: "destructive",
        });
      }

      setShowSuggestions(false);
      
      // Navigate to profile after brief delay
      setTimeout(() => {
        navigate("/profile");
      }, 1500);
    } catch (error: any) {
      console.error("Error confirming bookings:", error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to confirm bookings",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const RoomSuggestionCard = ({ 
    room, 
    isSelected, 
    onClick 
  }: { 
    room: RoomSuggestion; 
    isSelected: boolean; 
    onClick: () => void;
  }) => (
    <Card 
      className={`cursor-pointer transition-all border-2 ${
        isSelected 
          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20' 
          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-3 flex-1">
            {isSelected ? (
              <CheckCircle2 className="h-5 w-5 text-amber-400 mt-1 flex-shrink-0" />
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
              <CardTitle className="text-xl text-white">{suggestion.activity_name}</CardTitle>
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
            <Label className="text-sm text-slate-400 mb-2 block">
              Suggested Room (Click to select)
            </Label>
            <RoomSuggestionCard
              room={suggestion.suggested_room}
              isSelected={selectedRoomId === suggestion.suggested_room.room_id}
              onClick={() => toggleRoomSelection(index, suggestion.suggested_room.room_id)}
            />
          </div>
          
          {suggestion.alternative_rooms.length > 0 && (
            <div>
              <Label className="text-sm text-slate-400 mb-2 block">
                Alternative Options
              </Label>
              <div className="space-y-2">
                {suggestion.alternative_rooms.map((room) => (
                  <RoomSuggestionCard
                    key={room.room_id}
                    room={room}
                    isSelected={selectedRoomId === room.room_id}
                    onClick={() => toggleRoomSelection(index, room.room_id)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-amber-400" />
            AI Event Planner
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Describe your event needs and let AI find the perfect rooms for you
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* AI Prompt Section - MAIN FOCUS */}
          <Card className="border-amber-500/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400 flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Describe Your Event
              </CardTitle>
              <CardDescription className="text-slate-300">
                Tell us what you need in natural language - AI will handle the rest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="ai-prompt" className="text-slate-200 text-base font-semibold">
                  What would you like to plan?
                </Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: I need a room for a meeting tomorrow at 10 AM for 2 hours with a projector and whiteboard for 8 people. Also, I want to book a workshop space on Friday afternoon from 2-5 PM for 15 people."
                  className="min-h-[180px] bg-slate-900/70 border-slate-600 text-white text-base resize-none focus:border-amber-400 focus:ring-amber-400"
                  rows={8}
                />
                <p className="text-slate-400 text-sm flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-400" />
                  <span>
                    <strong>Default:</strong> AI will parse your text and assume 1 person if not specified. 
                    Include dates, times, number of people, and equipment needs for best results. 
                    {!isExplicitMode && (
                      <span className="text-amber-400"> (Currently in simple mode - only your prompt will be used)</span>
                    )}
                    {isExplicitMode && (
                      <span className="text-green-400"> (Detailed mode active - activities below will also be sent)</span>
                    )}
                  </span>
                </p>
              </div>

              {/* General Preferences */}
              <div className="space-y-3">
                <Label htmlFor="general-prefs" className="text-slate-200 font-semibold">
                  Additional Preferences (Optional)
                </Label>
                <Textarea
                  id="general-prefs"
                  value={generalPreferences}
                  onChange={(e) => setGeneralPreferences(e.target.value)}
                  placeholder="Example: Prefer rooms close to each other, budget-friendly options, quiet spaces..."
                  className="min-h-[80px] bg-slate-900/70 border-slate-600 text-white resize-none focus:border-amber-400 focus:ring-amber-400"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Collapsible Advanced Section */}
          <Collapsible open={isExplicitMode} onOpenChange={setIsExplicitMode}>
            <Card className="border-slate-700 bg-slate-800/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-amber-400" />
                      <CardTitle className="text-amber-400">
                        {isExplicitMode ? "✓ Using Detailed Mode" : "Use Detailed Activity Settings"}
                      </CardTitle>
                    </div>
                    {isExplicitMode ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <CardDescription className="text-slate-400">
                    {isExplicitMode 
                      ? "Activities and date will be sent explicitly along with your prompt" 
                      : "Click to manually specify date, time slots, participants, and amenities (optional)"
                    }
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  <Separator className="bg-slate-700" />
                  
                  {/* Date Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-amber-400" />
                      <Label className="text-slate-200 text-base font-semibold">Select Event Date</Label>
                    </div>
                    <div className="flex justify-center bg-slate-900/50 p-4 rounded-lg">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-md border border-slate-700 bg-slate-800/50"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center text-slate-200",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-400",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-amber-500/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-slate-300 hover:bg-slate-700 rounded-md",
                          day_selected: "bg-amber-500 text-slate-900 hover:bg-amber-500 hover:text-slate-900 focus:bg-amber-500 focus:text-slate-900",
                          day_today: "bg-slate-700 text-amber-400",
                          day_outside: "text-slate-600 opacity-50",
                          day_disabled: "text-slate-600 opacity-50",
                          day_range_middle: "aria-selected:bg-amber-500/20 aria-selected:text-slate-200",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Activities Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-400" />
                        <Label className="text-slate-200 text-base font-semibold">Activities</Label>
                      </div>
                      <Button
                        onClick={addActivity}
                        size="sm"
                        className="bg-amber-500 text-slate-900 hover:bg-amber-400"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Activity
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {activities.map((activity, idx) => (
                        <Card key={activity.id} className="border-slate-700 bg-slate-900/50">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base text-slate-200">
                                Activity #{idx + 1}
                              </CardTitle>
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
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              {/* Activity Type */}
                              <div className="md:col-span-2">
                                <Label className="text-slate-300 text-sm">Activity Type</Label>
                                <Select
                                  value={activity.activityType}
                                  onValueChange={(value) => updateActivity(activity.id, "activityType", value)}
                                >
                                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                                    <SelectValue />
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

                              {/* Custom Name if Custom type */}
                              {activity.activityType === "Custom" && (
                                <div className="md:col-span-2">
                                  <Label className="text-slate-300 text-sm">Custom Activity Name</Label>
                                  <Input
                                    value={activity.customName}
                                    onChange={(e) => updateActivity(activity.id, "customName", e.target.value)}
                                    placeholder="Enter custom activity name"
                                    className="bg-slate-800 border-slate-600 text-white mt-1"
                                  />
                                </div>
                              )}

                              {/* Start & End Time */}
                              <div>
                                <Label className="text-slate-300 text-sm">Start Time</Label>
                                <Select
                                  value={activity.startTime}
                                  onValueChange={(value) => updateActivity(activity.id, "startTime", value)}
                                >
                                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                                    <SelectValue />
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

                              <div>
                                <Label className="text-slate-300 text-sm">End Time</Label>
                                <Select
                                  value={activity.endTime}
                                  onValueChange={(value) => updateActivity(activity.id, "endTime", value)}
                                >
                                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                                    <SelectValue />
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

                              {/* Participants */}
                              <div className="md:col-span-2">
                                <Label className="text-slate-300 text-sm">
                                  Participants: <span className="text-amber-400 font-semibold">{activity.participantsCount}</span>
                                </Label>
                                <Slider
                                  value={[activity.participantsCount]}
                                  onValueChange={(value) => updateActivity(activity.id, "participantsCount", value[0])}
                                  min={1}
                                  max={100}
                                  step={1}
                                  className="mt-3"
                                />
                              </div>

                              {/* Amenities */}
                              <div className="md:col-span-2">
                                <Label className="text-slate-300 text-sm mb-2 block">Required Amenities</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-800/50 rounded-md max-h-[200px] overflow-y-auto">
                                  {AVAILABLE_AMENITIES.map((amenity) => (
                                    <div key={amenity} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${activity.id}-${amenity}`}
                                        checked={activity.selectedAmenities.includes(amenity)}
                                        onCheckedChange={() => toggleAmenity(activity.id, amenity)}
                                        className="border-slate-600"
                                      />
                                      <label
                                        htmlFor={`${activity.id}-${amenity}`}
                                        className="text-sm text-slate-300 cursor-pointer"
                                      >
                                        {amenity}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Preferences */}
                              <div className="md:col-span-2">
                                <Label className="text-slate-300 text-sm">Specific Preferences (Optional)</Label>
                                <Textarea
                                  value={activity.preferences}
                                  onChange={(e) => updateActivity(activity.id, "preferences", e.target.value)}
                                  placeholder="Any specific requirements for this activity..."
                                  className="bg-slate-800 border-slate-600 text-white mt-1 min-h-[60px]"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleGetSuggestions}
              disabled={isLoading}
              size="lg"
              className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 font-semibold text-lg h-14 px-12 shadow-lg shadow-amber-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  Getting AI Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6 mr-3" />
                  Get AI Suggestions
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Suggestions Dialog */}
        <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
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

export default AIEventPlannerNew;
