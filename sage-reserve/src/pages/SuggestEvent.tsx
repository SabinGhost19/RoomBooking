import { useState, useEffect } from "react";
import { Calendar, Clock, Sparkles, TrendingDown, Users, Beer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
            <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900">
              <Calendar className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuggestEvent;
