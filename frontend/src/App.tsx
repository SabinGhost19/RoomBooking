import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Rooms from "./pages/Rooms";
import RoomDetails from "./pages/RoomDetails";
import Booking from "./pages/Booking";
import Profile from "./pages/Profile";
import View2DMapReact from "./pages/View2DMapReact";
import SuggestEvent from "./pages/SuggestEvent";
import AIEventPlanner from "./pages/AIEventPlanner";
import { PendingApprovals } from "./pages/PendingApprovals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
            <Route path="/rooms/:roomId" element={<ProtectedRoute><RoomDetails /></ProtectedRoute>} />
            <Route path="/booking/:roomId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><View2DMapReact /></ProtectedRoute>} />
            <Route path="/suggest-event" element={<ProtectedRoute><SuggestEvent /></ProtectedRoute>} />
            <Route path="/ai-event-planner" element={<ProtectedRoute><AIEventPlanner /></ProtectedRoute>} />
            <Route path="/pending-approvals" element={<ProtectedRoute><PendingApprovals /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
