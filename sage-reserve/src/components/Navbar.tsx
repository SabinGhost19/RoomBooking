import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Home, User, LogOut, Map, Sparkles } from "lucide-react";
import { BeerMugIcon } from "@/components/BeerMugIcon";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-800/60 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <BeerMugIcon className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SpaceFlow</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            <Link to="/">
              <Button
                variant="ghost"
                className={`transition-all text-white hover:bg-white/10 ${
                  isActive("/") ? "bg-white/10" : ""
                }`}
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/rooms">
              <Button
                variant="ghost"
                className={`transition-all text-white hover:bg-white/10 ${
                  isActive("/rooms") ? "bg-white/10" : ""
                }`}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Rooms
              </Button>
            </Link>
            <Link to="/map">
              <Button
                variant="ghost"
                className={`transition-all text-white hover:bg-white/10 ${
                  isActive("/map") ? "bg-white/10" : ""
                }`}
              >
                <Map className="mr-2 h-4 w-4" />
                Map
              </Button>
            </Link>
            {isAuthenticated && user && (user as any).is_manager && (
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
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold">Sign Up</Button>
                </Link>
              </div>
            )}

            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any).avatar || undefined} alt={(user as any).username || 'User'} />
                      <AvatarFallback className="bg-amber-500 text-slate-900 font-bold">
                        {((user as any).username || 'U').slice(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-white font-medium">{(user as any).username || (user as any).full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-white/10">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer flex items-center gap-2 text-white hover:bg-white/10">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { logout(); }} className="text-white hover:bg-white/10">
                    <div className="flex items-center gap-2">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
