import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Home, User, LogOut, Map, Sparkles, CheckSquare } from "lucide-react";
import { BeerMugIcon } from "@/components/BeerMugIcon";
import NotificationBell from "@/components/NotificationBell";
import { useState, useEffect } from "react";
import { bookingAPI } from "@/lib/api";

import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const isActive = (path: string) => location.pathname === path;

  // Fetch pending bookings count for managers
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (isAuthenticated && user && (user as any).is_manager) {
        try {
          const data = await bookingAPI.getPendingBookingsCount();
          setPendingCount(data.pending_count);
        } catch (error) {
          // Silently fail - user might not be manager or not logged in
          console.error('Failed to fetch pending count:', error);
        }
      }
    };

    fetchPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 backdrop-blur-2xl shadow-2xl shadow-slate-900/30 overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-slate-500/5 to-amber-500/5 animate-[gradient_8s_ease_infinite]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(251,191,36,0.1),transparent_50%)]"></div>

      <div className="container mx-auto px-6 relative">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center transform group-hover:scale-105 transition-all duration-300 overflow-hidden p-1">
              <img src="/logo.png" alt="SpaceFlow Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 tracking-tight group-hover:tracking-wide transition-all duration-300">
                SpaceFlow
              </span>
              <span className="text-[10px] text-amber-400/60 font-semibold tracking-[0.2em] uppercase">
                Reserve · Connect · Thrive
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-3">
            {/* Only show Dashboard button when NOT authenticated */}
            {!isAuthenticated && (
              <Link to="/">
                <Button
                  variant="ghost"
                  className={`transition-all duration-300 text-white font-semibold px-5 py-2 rounded-lg
                    ${isActive("/")
                      ? "bg-white/10 text-amber-400"
                      : "hover:bg-white/10 hover:text-amber-400"
                    }`}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            )}
            <Link to="/rooms">
              <Button
                variant="ghost"
                className={`transition-all duration-300 text-white font-semibold px-5 py-2 rounded-lg
                  ${isActive("/rooms")
                    ? "bg-white/10 text-amber-400"
                    : "hover:bg-white/10 hover:text-amber-400"
                  }`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Rooms
              </Button>
            </Link>
            <Link to="/map">
              <Button
                variant="ghost"
                className={`transition-all duration-300 text-white font-semibold px-5 py-2 rounded-lg
                  ${isActive("/map")
                    ? "bg-white/10 text-amber-400"
                    : "hover:bg-white/10 hover:text-amber-400"
                  }`}
              >
                <Map className="mr-2 h-4 w-4" />
                Map
              </Button>
            </Link>
            <Link to="/ai-event-planner">
              <Button
                variant="ghost"
                className={`transition-all duration-300 text-white font-semibold px-5 py-2 rounded-lg
                  ${isActive("/ai-event-planner")
                    ? "bg-white/10 text-amber-400"
                    : "hover:bg-white/10 hover:text-amber-400"
                  }`}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Planner
              </Button>
            </Link>
            {isAuthenticated && user && (user as any).is_manager && (
              <>
                <Link to="/suggest-event">
                  <Button
                    variant="ghost"
                    className={`transition-all text-white hover:bg-white/10 ${
                      isActive("/suggest-event") ? "bg-white/10" : ""
                    }`}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Suggest Event
                  </Button>
                </Link>
                <Link to="/pending-approvals">
                  <Button
                    variant="ghost"
                    className={`relative transition-all text-white hover:bg-white/10 ${
                      isActive("/pending-approvals") ? "bg-white/10" : ""
                    }`}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Approvals
                    {pendingCount > 0 && (
                      <Badge 
                        className="ml-2 bg-red-500 text-white px-2 py-0.5 text-xs"
                      >
                        {pendingCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-white hover:text-amber-400 hover:bg-white/10 font-semibold px-4 py-2 rounded-lg transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-amber-500 text-slate-900 hover:bg-amber-400 font-bold px-5 py-2 rounded-lg transition-all duration-300">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {isAuthenticated && user && (

              <>
                {/* Notification Bell */}
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-300">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any).avatar_url || undefined} alt={(user as any).username || 'User'} />
                        <AvatarFallback className="bg-amber-500 text-slate-900 font-bold">
                          {((user as any).username || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-white font-medium">
                        {(user as any).username || (user as any).full_name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-white/10 rounded-lg">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-md transition-all duration-200">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => { logout(); }} className="text-white hover:bg-white/10 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>

            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
