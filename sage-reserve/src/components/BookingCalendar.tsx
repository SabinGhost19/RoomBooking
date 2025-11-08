import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface BookingCalendarProps {
  onDateSelect?: (date: Date | undefined) => void;
  onTimeSelect?: (time: string) => void;
}

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00"
];

const bookedSlots = ["10:00", "14:00"]; // Mock booked slots

export const BookingCalendar = ({ onDateSelect, onTimeSelect }: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onTimeSelect?.(time);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-slate-800/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Select Date</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-md border border-slate-600 pointer-events-auto bg-slate-700/40 text-white"
          />
        </CardContent>
      </Card>

      <Card className="bg-slate-800/60 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5" />
            Select Time Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {timeSlots.map((time) => {
              const isBooked = bookedSlots.includes(time);
              const isSelected = selectedTime === time;
              
              return (
                <Button
                  key={time}
                  variant={isSelected ? "default" : "outline"}
                  disabled={isBooked}
                  onClick={() => handleTimeSelect(time)}
                  className={`relative ${
                    isSelected 
                      ? "bg-amber-500 text-slate-900 hover:bg-amber-400" 
                      : "bg-slate-700/40 text-white border-slate-600 hover:bg-slate-700"
                  } ${isBooked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {time}
                  {isBooked && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 text-xs bg-slate-700 text-slate-300"
                    >
                      Booked
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
