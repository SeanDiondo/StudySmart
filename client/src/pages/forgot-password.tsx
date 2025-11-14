import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to send verification code",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Code Sent",
        description: "Check your email for the verification code",
      });
      
      setStep('code');
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationCode, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Reset Failed",
          description: data.message || "Failed to reset password",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Password Reset",
        description: "Your password has been successfully reset",
      });
      
      setStep('success');
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
          <h1 className="text-3xl font-bold font-display">Reset Your Password</h1>
          <p className="text-muted-foreground">
            {step === 'email' && "Enter your email to receive a verification code"}
            {step === 'code' && "Enter the code and your new password"}
            {step === 'success' && "Your password has been reset"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'email' && "Forgot Password"}
              {step === 'code' && "Reset Password"}
              {step === 'success' && "Success"}
            </CardTitle>
            <CardDescription>
              {step === 'email' && "We'll send a verification code to your email"}
              {step === 'code' && "Enter the 6-digit code from your email"}
              {step === 'success' && "You can now sign in with your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-4">
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
                <Button type="submit" className="w-full" size="lg" disabled={isLoading} data-testid="button-send-code">
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    required
                    data-testid="input-code"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to {email}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    data-testid="input-confirm-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('email')}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading} data-testid="button-reset-password">
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg font-semibold mb-2">Password Reset Successfully</p>
                  <p className="text-sm text-muted-foreground">
                    You can now sign in with your new password
                  </p>
                </div>
                <Link href="/login">
                  <Button className="w-full" size="lg" data-testid="button-go-to-login">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <Link href="/login">
                <span className="text-muted-foreground hover:text-primary cursor-pointer" data-testid="link-back-to-login">
                  Back to Sign In
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
