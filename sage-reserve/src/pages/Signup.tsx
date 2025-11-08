import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeerMugIcon } from '@/components/BeerMugIcon';
import { useToast } from "@/hooks/use-toast";

const IT_POSITIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "QA Engineer",
  "Software Architect",
  "Product Manager",
  "UI/UX Designer",
  "Scrum Master",
  "Business Analyst",
  "Cloud Engineer",
  "Security Engineer",
  "Database Administrator",
  "Mobile Developer",
  "Tech Lead",
  "Engineering Manager",
  "CTO",
  "IT Support Specialist"
];

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"client" | "manager" | "">("");
  const [position, setPosition] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }
    if (!role) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }
    if (!position) {
      toast({
        title: "Error",
        description: "Please select your position",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Account created",
      description: `Welcome to RoomBook as a ${role}!`,
    });
    navigate("/");
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

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-100 font-medium">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "client" | "manager")}>
                <SelectTrigger className="bg-slate-700/40 text-white border border-slate-600 focus:ring-2 focus:ring-amber-400 rounded-lg py-3">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-slate-600">
                  <SelectItem value="client" className="text-slate-200 hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white cursor-pointer">Client</SelectItem>
                  <SelectItem value="manager" className="text-slate-200 hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white cursor-pointer">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-slate-100 font-medium">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="bg-slate-700/40 text-white border border-slate-600 focus:ring-2 focus:ring-amber-400 rounded-lg py-3">
                  <SelectValue placeholder="Select your position" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border border-slate-600 max-h-60">
                  {IT_POSITIONS.map((pos) => (
                    <SelectItem 
                      key={pos} 
                      value={pos}
                      className="text-slate-200 hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white cursor-pointer"
                    >
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400 py-3 rounded-lg shadow-md">
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-slate-200">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-400 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
