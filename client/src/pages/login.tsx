import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/password-login", { email, password });
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in to your account.",
      });
      setLocation("/dashboard");
      window.location.reload(); // Reload to refresh auth state
    } catch (error: any) {
      // Provide more descriptive error messages
      let errorTitle = "Unable to Sign In";
      let errorDescription = "Please check your credentials and try again";
      
      if (error.message) {
        if (error.message.toLowerCase().includes("not found") || error.message.toLowerCase().includes("no user")) {
          errorTitle = "Account Not Found";
          errorDescription = "No account exists with this email address. Please check your email or sign up for a new account.";
        } else if (error.message.toLowerCase().includes("password")) {
          errorTitle = "Incorrect Password";
          errorDescription = "The password you entered is incorrect. Please try again or use 'Forgot password' to reset it.";
        } else if (error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("connection")) {
          errorTitle = "Connection Error";
          errorDescription = "Unable to connect to the server. Please check your internet connection and try again.";
        } else {
          errorDescription = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-4 cursor-pointer">
              <Brain className="h-10 w-10 text-primary" />
              <span className="text-2xl font-bold font-display">CCIT Study Plan</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold font-display">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue your learning journey</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login to Your Account</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password">
                    <span className="text-sm text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                      Forgot password?
                    </span>
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading} data-testid="button-login-submit">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/signup">
                <span className="text-primary hover:underline cursor-pointer font-medium" data-testid="link-signup">
                  Sign up
                </span>
              </Link>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
