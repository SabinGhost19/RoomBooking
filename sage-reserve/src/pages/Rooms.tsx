import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, SlidersHorizontal, Map, Loader2, Calendar as CalendarIcon, Clock, Users, CheckCircle2 } from "lucide-react";
import { getRooms, Room } from "@/lib/roomsApi";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const Rooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [capacityFilter, setCapacityFilter] = useState<number>(50);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [filterByDateTime, setFilterByDateTime] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate time slots from 7:00 to 22:00
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Validate time selection
  useEffect(() => {
    if (startTime >= endTime) {
      const startHour = parseInt(startTime.split(':')[0]);
      const newEndHour = Math.min(startHour + 1, 21);
      setEndTime(`${newEndHour.toString().padStart(2, '0')}:00`);
    }
  }, [startTime, endTime]);

  useEffect(() => {
    fetchRooms();
  }, [searchTerm, capacityFilter, availabilityFilter, sortBy, sortOrder, filterByDateTime, selectedDate, startTime, endTime]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm || undefined,
        max_capacity: capacityFilter || undefined,
        is_available: availabilityFilter === "all" ? undefined : availabilityFilter === "available",
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      let allRooms = await getRooms(filters);

      // Filter by date and time availability if enabled
      if (filterByDateTime && selectedDate) {
        const availableRooms: Room[] = [];

        for (const room of allRooms) {
          try {
            const bookingDate = selectedDate.toISOString().split('T')[0];
            const availability = await api.bookings.checkAvailability({
              room_id: room.id,
              booking_date: bookingDate,
              start_time: `${startTime}:00`,
              end_time: `${endTime}:00`,
            });

            if (availability.available) {
              availableRooms.push(room);
            }
          } catch (error) {
            console.error(`Error checking availability for room ${room.id}:`, error);
          }
        }

        setRooms(availableRooms);
      } else {
        setRooms(allRooms);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to fetch rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCapacityFilter(50);
    setAvailabilityFilter("all");
    setSelectedDate(new Date());
    setStartTime("09:00");
    setEndTime("10:00");
    setFilterByDateTime(false);
    setSortBy('name');
    setSortOrder('asc');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-3">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent">
            Browse Rooms
          </h1>
          <p className="text-slate-400 text-lg flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-amber-400 animate-pulse"></span>
            Find the perfect space for your needs
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 sticky top-20 bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95 border border-amber-500/20 backdrop-blur-xl shadow-2xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all duration-300 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] min-w-[320px]">
            <CardHeader className="pb-4 border-b border-white/10 flex-shrink-0">
              <CardTitle className="flex items-center gap-3 text-white text-xl font-bold">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-lg shadow-amber-500/30">
                  <SlidersHorizontal className="h-5 w-5 text-slate-900" />
                </div>
                <span className="bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
                  Filter Options
                </span>
              </CardTitle>
              <p className="text-slate-400 text-sm mt-2">Refine your search results</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 pb-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-700/20 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-amber-500 [&::-webkit-scrollbar]:mr-2">
              <div className="space-y-3 group">
                <Label htmlFor="search" className="text-slate-300 font-medium flex items-center gap-2">
                  <Search className="h-4 w-4 text-amber-400" />
                  Search Rooms
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-amber-400/60 transition-colors group-hover:text-amber-400" />
                  <Input
                    id="search"
                    placeholder="Type room name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-slate-700/50 text-white border border-slate-600/50 placeholder-slate-500 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200 hover:bg-slate-700/70"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-300 font-medium flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  Availability Status
                </Label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="bg-slate-700/50 text-white border border-slate-600/50 rounded-xl py-3 hover:bg-slate-700/70 transition-all duration-200 focus:ring-2 focus:ring-amber-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border border-slate-600/50 text-white rounded-xl shadow-2xl">
                    <SelectItem value="all" className="focus:bg-amber-500/20">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                        All Rooms
                      </span>
                    </SelectItem>
                    <SelectItem value="available" className="focus:bg-amber-500/20">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-400"></div>
                        Available Only
                      </span>
                    </SelectItem>
                    <SelectItem value="unavailable" className="focus:bg-amber-500/20">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-400"></div>
                        Unavailable
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 p-4 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-amber-400" />
                    Max Capacity
                  </Label>
                  <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                    <span className="text-amber-400 font-bold text-sm">{capacityFilter}</span>
                    <span className="text-amber-400/70 text-xs ml-1">people</span>
                  </div>
                </div>
                <Slider
                  value={[capacityFilter]}
                  onValueChange={(value) => setCapacityFilter(value[0])}
                  max={50}
                  min={4}
                  step={2}
                  className="mt-3 [&_[role=slider]]:bg-amber-500 [&_[role=slider]]:border-amber-400 [&_[role=slider]]:shadow-lg [&_[role=slider]]:shadow-amber-500/50 [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-amber-500 [&_.bg-primary]:to-amber-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>4</span>
                  <span>50</span>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-200 font-medium flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/20 rounded-lg">
                      <CalendarIcon className="h-4 w-4 text-amber-400" />
                    </div>
                    Date & Time Filter
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterByDateTime(!filterByDateTime)}
                    className={`relative px-3 py-1 rounded-lg font-semibold text-xs transition-all duration-300 ${filterByDateTime
                      ? "bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-lg shadow-amber-500/30"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/50"
                      }`}
                  >
                    {filterByDateTime ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> ON
                      </span>
                    ) : (
                      "OFF"
                    )}
                  </Button>
                </div>

                {filterByDateTime && (
                  <div className="space-y-4 border-t border-amber-500/20 pt-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                      <Label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                        <CalendarIcon className="h-3.5 w-3.5 text-amber-400" />
                        Select Date
                      </Label>
                      <div className="bg-slate-700/30 p-4 rounded-xl border border-white/10 flex justify-center">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          className="rounded-lg
                            [&_.rdp-months]:flex [&_.rdp-months]:justify-center
                            [&_.rdp-month]:max-w-full
                            [&_.rdp-table]:w-full [&_.rdp-table]:max-w-[280px]
                            [&_.rdp-caption]:flex [&_.rdp-caption]:items-center [&_.rdp-caption]:justify-center [&_.rdp-caption]:mb-4 [&_.rdp-caption]:relative
                            [&_.rdp-caption_label]:text-white [&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-base
                            [&_.rdp-nav]:flex [&_.rdp-nav]:gap-1 [&_.rdp-nav]:absolute [&_.rdp-nav]:w-full [&_.rdp-nav]:justify-between
                            [&_.rdp-nav_button]:h-9 [&_.rdp-nav_button]:w-9 [&_.rdp-nav_button]:rounded-lg [&_.rdp-nav_button]:border [&_.rdp-nav_button]:border-amber-500/30 [&_.rdp-nav_button]:bg-amber-500/10 [&_.rdp-nav_button]:text-amber-400 [&_.rdp-nav_button:hover]:bg-amber-500/20 [&_.rdp-nav_button:hover]:border-amber-500/50 [&_.rdp-nav_button]:transition-all
                            [&_.rdp-head_cell]:text-slate-400 [&_.rdp-head_cell]:font-semibold [&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:pb-2 [&_.rdp-head_cell]:w-10
                            [&_.rdp-cell]:p-0.5
                            [&_.rdp-button]:h-10 [&_.rdp-button]:w-10 [&_.rdp-button]:rounded-lg [&_.rdp-button]:text-white/80 [&_.rdp-button]:text-sm [&_.rdp-button]:font-medium [&_.rdp-button]:transition-all [&_.rdp-button]:duration-200
                            [&_.rdp-button:hover]:bg-amber-500/20 [&_.rdp-button:hover]:text-white [&_.rdp-button:hover]:scale-105
                            [&_.rdp-day_selected]:!bg-gradient-to-br [&_.rdp-day_selected]:!from-amber-500 [&_.rdp-day_selected]:!to-amber-600 [&_.rdp-day_selected]:!text-slate-900 [&_.rdp-day_selected]:!font-bold [&_.rdp-day_selected]:!shadow-lg [&_.rdp-day_selected]:!shadow-amber-500/50 [&_.rdp-day_selected]:!scale-105
                            [&_.rdp-day_today]:bg-slate-600/50 [&_.rdp-day_today]:text-amber-400 [&_.rdp-day_today]:font-bold [&_.rdp-day_today]:ring-2 [&_.rdp-day_today]:ring-amber-500/50
                            [&_.rdp-day_outside]:text-white/20 [&_.rdp-day_outside]:opacity-30
                            [&_.rdp-day_disabled]:text-white/10 [&_.rdp-day_disabled]:opacity-20 [&_.rdp-day_disabled]:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
                          <div className="p-1 bg-green-500/20 rounded">
                            <Clock className="h-3 w-3 text-green-400" />
                          </div>
                          Start Time
                        </Label>
                        <Select value={startTime} onValueChange={setStartTime}>
                          <SelectTrigger className="bg-slate-700/50 text-white border border-slate-600/50 rounded-xl hover:bg-slate-700/70 transition-all py-2.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border border-slate-600/50 text-white rounded-xl shadow-2xl max-h-60">
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time} className="focus:bg-amber-500/20">
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
                          <div className="p-1 bg-red-500/20 rounded">
                            <Clock className="h-3 w-3 text-red-400" />
                          </div>
                          End Time
                        </Label>
                        <Select value={endTime} onValueChange={setEndTime}>
                          <SelectTrigger className="bg-slate-700/50 text-white border border-slate-600/50 rounded-xl hover:bg-slate-700/70 transition-all py-2.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border border-slate-600/50 text-white rounded-xl shadow-2xl max-h-60">
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time} className="focus:bg-amber-500/20">
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        <span className="font-semibold">🔍 Active Filter:</span> Showing rooms available on{" "}
                        <span className="font-bold text-amber-400">{selectedDate?.toLocaleDateString()}</span>
                        {" "}from{" "}
                        <span className="font-bold text-green-400">{startTime}</span>
                        {" "}to{" "}
                        <span className="font-bold text-red-400">{endTime}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  className="w-full bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-white border border-slate-600/50 hover:from-slate-700 hover:to-slate-800 hover:border-amber-500/50 transition-all duration-300 rounded-xl py-3 font-semibold shadow-lg hover:shadow-amber-500/20 group"
                  onClick={handleResetFilters}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Reset All Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between p-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Search className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {loading ? 'Searching...' : `${rooms.length} ${rooms.length === 1 ? 'Room' : 'Rooms'} Found`}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {loading ? 'Please wait' : 'Select a room to view details'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/map')}
                className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-400 border-amber-500/30 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600 hover:text-slate-900 hover:border-amber-500 transition-all duration-300 rounded-xl shadow-lg hover:shadow-amber-500/30 group"
              >
                <Map className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                View 2D Map
              </Button>
            </div>

            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 gap-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                  <div className="absolute inset-0 h-12 w-12 animate-ping text-amber-500/20">
                    <Loader2 className="h-12 w-12" />
                  </div>
                </div>
                <p className="text-slate-400 font-medium">Finding perfect rooms for you...</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {rooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>

                {rooms.length === 0 && (
                  <Card className="p-12 text-center bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-amber-500/20 backdrop-blur-sm shadow-xl">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                        <Search className="h-8 w-8 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-lg mb-2">No rooms found</p>
                        <p className="text-slate-400">Try adjusting your filters or search criteria</p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;
