// components/ResetPasswordHandler.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const ResetPasswordHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("=== DEBUG: ResetPasswordHandler ===");
    console.log("Full URL:", window.location.href);
    console.log("Location:", {
      hash: location.hash,
      search: location.search,
      pathname: location.pathname
    });

    let accessToken: string | null = null;
    let type: string | null = null;
    let expiresAt: string | null = null;

    // Supabase sends tokens in the URL fragment (after #)
    if (location.hash) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      accessToken = hashParams.get('access_token');
      type = hashParams.get('type');
      expiresAt = hashParams.get('expires_at');
      
      console.log("From hash:", { accessToken, type, expiresAt });
    }

    // Also check query parameters as fallback
    if (!accessToken && location.search) {
      const searchParams = new URLSearchParams(location.search);
      accessToken = searchParams.get('access_token');
      type = searchParams.get('type');
      expiresAt = searchParams.get('expires_at');
      
      console.log("From query:", { accessToken, type, expiresAt });
    }

    console.log("Final extracted:", { 
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'null',
      type,
      expiresAt 
    });

    if (accessToken && type === 'recovery') {
      if (accessToken.startsWith('eyJ') && accessToken.includes('.')) {
        console.log("✓ Valid JWT token detected");
        
        // Store in sessionStorage (more secure than localStorage)
        sessionStorage.setItem('reset_token', accessToken);
        if (expiresAt) {
          sessionStorage.setItem('token_expires_at', expiresAt);
        }
        
        // Redirect with encoded token
        navigate(`/reset-password?token=${encodeURIComponent(accessToken)}`, { 
          replace: true
        });
      } else {
        console.error("✗ Invalid JWT token format");
        toast({
          title: "Invalid reset link",
          description: "The reset link appears to be malformed.",
          variant: "destructive",
        });
        navigate('/reset-password?error=invalid_token', { replace: true });
      }
    } else {
      console.error("✗ Missing required parameters");
      toast({
        title: "Invalid reset link",
        description: "The reset link is missing required information.",
        variant: "destructive",
      });
      navigate('/reset-password?error=invalid_token', { replace: true });
    }
  }, [location, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Processing reset request...</p>
      </div>
    </div>
  );
};

export default ResetPasswordHandler;