import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Mail, User, Bell, Shield, Loader2 } from "lucide-react";
import { mockBookings } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import api, { BookingResponse } from "@/lib/api";

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Load bookings on component mount
  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;

      setLoadingBookings(true);
      try {
        const myBookings = await api.bookings.getMyBookings();
        setBookings(myBookings);
      } catch (error: any) {
        console.error("Failed to load bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setLoadingBookings(false);
      }
    };

    loadBookings();
  }, [user, toast]);

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      await api.users.updateCurrentUser({
        full_name: name,
        email,
      });
      await refreshUser();
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      await api.bookings.cancelBooking(bookingId);
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
      // Reload bookings
      const myBookings = await api.bookings.getMyBookings();
      setBookings(myBookings);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    // Convert "HH:MM:SS" to "HH:MM AM/PM"
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900">

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
            <p className="text-slate-300">Manage your account and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/60 border-white/10">
              <TabsTrigger value="profile" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-white">Profile</TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-white">My Bookings</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-white">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-slate-800/60 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                  <CardDescription className="text-slate-300">Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="bg-amber-500 text-slate-900 text-2xl font-bold">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg text-white">{user.username}</h3>
                      <p className="text-sm text-slate-300">{user.email}</p>
                      {user.is_superuser && (
                        <Badge variant="secondary" className="mt-1 bg-amber-500 text-slate-900">Admin</Badge>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-200">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-slate-700/40 text-white border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-200">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-700/40 text-white border-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-slate-200">Username</Label>
                      <Input
                        id="username"
                        value={user.username}
                        disabled
                        className="bg-slate-700/40 text-slate-400 border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveChanges} disabled={loading} className="bg-amber-500 text-slate-900 hover:bg-amber-400">
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="bg-slate-700/40 text-white border-slate-600 hover:bg-slate-700">
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/60 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400 mb-1">
                        {user.is_superuser ? "Admin" : "User"}
                      </div>
                      <div className="text-sm text-slate-300">Account Type</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400 mb-1">
                        {user.is_active ? "Active" : "Inactive"}
                      </div>
                      <div className="text-sm text-slate-300">Status</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              {loadingBookings ? (
                <Card className="bg-slate-800/60 border-white/10">
                  <CardContent className="pt-6 flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </CardContent>
                </Card>
              ) : bookings.length === 0 ? (
                <Card className="bg-slate-800/60 border-white/10">
                  <CardContent className="pt-6 text-center py-12">
                    <p className="text-slate-300">No bookings found</p>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="bg-slate-800/60 border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-white">Room #{booking.room_id}</h3>
                          <p className="text-sm text-slate-300">{formatDate(booking.booking_date)}</p>
                        </div>
                        <Badge
                          variant={
                            booking.status === "upcoming"
                              ? "default"
                              : booking.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                          className={booking.status === "upcoming" ? "bg-amber-500 text-slate-900" : ""}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                        </div>
                      </div>
                      {booking.status === "upcoming" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-slate-700/40 text-white border-slate-600 hover:bg-slate-700"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-slate-800/60 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Configure how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-200">Email Notifications</Label>
                      <p className="text-sm text-slate-400">
                        Receive booking confirmations and updates
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-200">Booking Reminders</Label>
                      <p className="text-sm text-slate-400">
                        Get reminders before your bookings
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-200">Marketing Emails</Label>
                      <p className="text-sm text-slate-400">
                        Receive updates about new features
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/60 border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Manage your security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start bg-slate-700/40 text-white border-slate-600 hover:bg-slate-700">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-slate-700/40 text-white border-slate-600 hover:bg-slate-700">
                    Enable Two-Factor Authentication
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
