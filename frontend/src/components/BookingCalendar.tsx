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
      <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-primary/20 backdrop-blur-sm shadow-2xl hover:shadow-primary/20 transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-xl font-semibold tracking-tight">Select Date</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-xl border border-primary/20 pointer-events-auto bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-sm p-4 shadow-lg
            [&_.rdp-months]:gap-6
            [&_.rdp-caption]:mb-4
            [&_.rdp-caption_label]:text-white/90 [&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-base
            [&_.rdp-nav_button]:h-8 [&_.rdp-nav_button]:w-8 [&_.rdp-nav_button]:rounded-lg [&_.rdp-nav_button]:border [&_.rdp-nav_button]:border-primary/30 [&_.rdp-nav_button]:bg-slate-700/50 [&_.rdp-nav_button]:text-primary [&_.rdp-nav_button:hover]:bg-primary/20 [&_.rdp-nav_button:hover]:border-primary/50 [&_.rdp-nav_button]:transition-all [&_.rdp-nav_button]:duration-200
            [&_.rdp-head_cell]:text-primary/80 [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-sm [&_.rdp-head_cell]:pb-2
            [&_.rdp-cell]:p-0.5
            [&_.rdp-button]:h-10 [&_.rdp-button]:w-10 [&_.rdp-button]:rounded-lg [&_.rdp-button]:text-white/80 [&_.rdp-button]:font-medium [&_.rdp-button]:transition-all [&_.rdp-button]:duration-200
            [&_.rdp-button:hover]:bg-amber-500/20 [&_.rdp-button:hover]:text-white [&_.rdp-button:hover]:scale-105 [&_.rdp-button:hover]:shadow-md
            [&_.rdp-day_selected]:!bg-amber-500 [&_.rdp-day_selected]:!text-slate-900 [&_.rdp-day_selected]:!font-bold [&_.rdp-day_selected]:!shadow-lg [&_.rdp-day_selected]:!shadow-amber-500/50 [&_.rdp-day_selected]:!scale-105
            [&_.rdp-day_today]:bg-slate-600/50 [&_.rdp-day_today]:text-amber-400 [&_.rdp-day_today]:font-semibold [&_.rdp-day_today]:border [&_.rdp-day_today]:border-amber-400/40
            [&_.rdp-day_outside]:text-white/30 [&_.rdp-day_outside]:opacity-40
            [&_.rdp-day_disabled]:text-white/20 [&_.rdp-day_disabled]:opacity-30 [&_.rdp-day_disabled]:cursor-not-allowed"
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
                  className={`relative ${isSelected
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
