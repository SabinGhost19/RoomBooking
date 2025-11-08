import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BeerMugIcon } from '@/components/BeerMugIcon';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await signup({
        email,
        username,
        password,
        full_name: name,
        is_manager: isManager,
      });
      toast({
        title: "Account created",
        description: `Welcome to RoomBook${isManager ? ' as a Manager' : ''}!`,
      });
      navigate("/");
    } catch (error: any) {
      // Error is already handled in the auth context
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md animate-fade-in bg-slate-800/60 border border-white/10">
        <CardHeader className="space-y-1 text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
              <BeerMugIcon className="h-6 w-6 text-slate-900" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Create an Account</CardTitle>
          <CardDescription className="text-slate-200">
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-100 font-medium">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700/40 text-white placeholder-slate-300 border border-slate-600 focus:ring-2 focus:ring-amber-400 rounded-lg py-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-100 font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-slate-700/40 text-white placeholder-slate-300 border border-slate-600 focus:ring-2 focus:ring-amber-400 rounded-lg py-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-100 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700/40 text-white placeholder-slate-300 border border-slate-600 focus:ring-2 focus:ring-amber-400 rounded-lg py-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-100 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters with uppercase, lowercase & number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-700/40 text-white placeholder-slate-300 border border-slate-600 focus:ring-2 focus:ring-amber-400 rounded-lg py-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-100 font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-700/40 text-white placeholder-slate-300 border border-slate-600 focus:ring-2 focus:ring-amber-400 rounded-lg py-3"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isManager" 
                checked={isManager}
                onCheckedChange={(checked) => setIsManager(checked as boolean)}
                className="border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <Label 
                htmlFor="isManager" 
                className="text-slate-100 font-medium cursor-pointer"
              >
                Register as a Manager
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400 py-3 rounded-lg shadow-md"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
