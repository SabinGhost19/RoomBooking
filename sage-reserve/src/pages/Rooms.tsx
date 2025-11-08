import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, SlidersHorizontal, Map, Loader2 } from "lucide-react";
import { getRooms, Room } from "@/lib/roomsApi";
import { useToast } from "@/hooks/use-toast";

const Rooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [capacityFilter, setCapacityFilter] = useState<number>(50);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, [searchTerm, capacityFilter, availabilityFilter, priceRange, sortBy, sortOrder]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const filters = {
        search: searchTerm || undefined,
        max_capacity: capacityFilter || undefined,
        min_price: priceRange[0],
        max_price: priceRange[1],
        is_available: availabilityFilter === "all" ? undefined : availabilityFilter === "available",
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const data = await getRooms(filters);
      setRooms(data);
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
    setPriceRange([0, 200]);
    setSortBy('name');
    setSortOrder('asc');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Browse Rooms</h1>
          <p className="text-slate-300">Find the perfect space for your needs</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 h-fit sticky top-20 bg-slate-800/60 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-slate-200">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-700/40 text-white border-slate-600 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Availability</Label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="bg-slate-700/40 text-white border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    <SelectItem value="all">All Rooms</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Max Capacity: {capacityFilter} people</Label>
                <Slider
                  value={[capacityFilter]}
                  onValueChange={(value) => setCapacityFilter(value[0])}
                  max={50}
                  min={4}
                  step={2}
                  className="mt-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">Price Range: ${priceRange[0]} - ${priceRange[1]}/hour</Label>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={200}
                  min={0}
                  step={10}
                  className="mt-2"
                />
              </div>

              <Button
                variant="outline"
                className="w-full bg-slate-700/40 text-white border-slate-600 hover:bg-slate-700"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-slate-300">
                {loading ? 'Loading...' : `${rooms.length} ${rooms.length === 1 ? 'room' : 'rooms'} found`}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/map')}
                className="bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-slate-900 transition-colors"
              >
                <Map className="mr-2 h-4 w-4" />
                View 2D Map
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {rooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>

                {rooms.length === 0 && (
                  <Card className="p-12 text-center bg-slate-800/60 border-white/10">
                    <p className="text-slate-300">No rooms match your filters. Try adjusting your search criteria.</p>
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
