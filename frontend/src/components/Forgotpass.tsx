// components/ForgotPasswordModal.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Mail, 
  Loader2,
  CheckCircle,
  X,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { forgotPassword } from "@/lib/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin?: () => void;
}

const ForgotPasswordModal = ({ 
  isOpen, 
  onClose, 
  onBackToLogin 
}: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await forgotPassword({ email });
      setIsSuccess(true);
      
      toast({
        title: "Email sent",
        description: "If the email exists, a password reset link has been sent.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setIsSuccess(false);
    setIsLoading(false);
    onClose();
  };

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    }
    handleClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Close Button (X) in the top right corner */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? "Check your email for a password reset link." 
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <DialogFooter className="flex flex-col sm:flex-col gap-2">
              <Button 
                type="submit" 
                disabled={isLoading || !email}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              
              {onBackToLogin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              )}
            </DialogFooter>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions.
            </p>
            
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>

            <DialogFooter className="flex flex-col gap-2">
              <Button
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsSuccess(false)}
                className="w-full"
              >
                Try Another Email
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;