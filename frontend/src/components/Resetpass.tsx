// components/ResetPasswordPage.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Key
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { resetPassword } from "@/lib/api";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(true);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // In ResetPasswordPage.tsx, update the useEffect
useEffect(() => {
  // Get token from URL parameters
  const urlToken = searchParams.get('token');
  const error = searchParams.get('error');

  console.log("=== DEBUG: ResetPasswordPage ===");
  console.log("URL Token:", urlToken);
  console.log("Token type:", typeof urlToken);
  console.log("Token length:", urlToken?.length);
  console.log("Token starts with eyJ:", urlToken?.startsWith('eyJ'));
  console.log("Error param:", error);

  // Check localStorage too
  const storedToken = localStorage.getItem('reset_token');
  console.log("Stored token from localStorage:", storedToken);
  console.log("Stored token length:", storedToken?.length);

  if (error === 'invalid_token') {
    setIsValidToken(false);
    setIsCheckingToken(false);
    toast({
      title: "Invalid reset link",
      description: "This password reset link is invalid or malformed.",
      variant: "destructive",
    });
    return;
  }

  // Prefer URL token over localStorage
  const finalToken = urlToken || storedToken;
  
  if (finalToken) {
    // Validate it's a JWT token
    if (finalToken.startsWith('eyJ') && finalToken.includes('.')) {
      setToken(finalToken);
      setIsValidToken(true);
      setIsCheckingToken(false);
      console.log("✓ Valid token received");
      
      // Clean up localStorage if we used URL token
      if (urlToken) {
        localStorage.removeItem('reset_token');
        localStorage.removeItem('token_expires_at');
      }
    } else {
      console.error("✗ Invalid token format:", finalToken);
      setIsValidToken(false);
      setIsCheckingToken(false);
      toast({
        title: "Invalid reset link",
        description: "The reset token appears to be malformed.",
        variant: "destructive",
      });
    }
  } else {
    setIsValidToken(false);
    setIsCheckingToken(false);
    toast({
      title: "Invalid reset link",
      description: "Please request a new password reset link.",
      variant: "destructive",
    });
  }
}, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Error",
        description: "No valid reset token found.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword({
        newPassword,
        confirmPassword,
        token
      });
      
      setIsSuccess(true);
      // Clean up any stored tokens
      localStorage.removeItem('reset_token');
      localStorage.removeItem('token_expires_at');
      
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/login');
    toast({
      title: "Request new link",
      description: "Please use the 'Forgot Password' option on the login page.",
    });
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate('/login')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
            <Button
              variant="outline"
              onClick={handleRequestNewLink}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been updated successfully. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it's at least 6 characters long.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pr-10"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pr-10"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/login')}
              disabled={isLoading}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;