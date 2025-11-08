import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign } from "lucide-react";
import { Room } from "@/lib/roomsApi";
import { Link } from "react-router-dom";

interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-slate-800/60 border-white/10">
      <div className="relative h-48 overflow-hidden">
        <img
          src={room.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'}
          alt={room.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {!room.is_available && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm bg-slate-700 text-slate-300">Unavailable</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-white">{room.name}</h3>
          {room.is_available && (
            <Badge variant="default" className="bg-amber-500 text-slate-900 hover:bg-amber-400">Available</Badge>
          )}
        </div>
        <p className="text-sm text-slate-300 mb-4">{room.description || 'No description available'}</p>
        <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-slate-400" />
            <span>{room.capacity} people</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {room.amenities && room.amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
              {amenity}
            </Badge>
          ))}
          {room.amenities && room.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
              +{room.amenities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex gap-2">
        <Link to={`/rooms/${room.id}`} className="flex-1">
          <Button
            className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold"
            disabled={!room.is_available}
          >
            View & Book
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
