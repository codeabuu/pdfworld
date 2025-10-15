import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Lock, Mail, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { authService } from "@/services/Myauthservice";

interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  agreeToTerms?: string;
}

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<SignUpForm>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Email validation
    if (!form.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
      isValid = false;
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Name validation
    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      isValid = false;
    }

    // Terms agreement validation
    if (!form.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: keyof SignUpForm) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === "agreeToTerms" ? e.target.checked : e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.signUp(
        form.email, 
        form.password, 
        form.firstName, 
        form.lastName
      );
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/confirm-email", { 
          state: { message: "signup_success" }
        });
      });
      
    } catch (err: any) {
      setError(err.message || "Too many attempts, please try again later.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const API_BASE_URL = 'http://127.0.0.1:8000';
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      console.log('Initiating Google OAuth with:', {
        API_BASE_URL,
        redirectTo,
        fullUrl: `${API_BASE_URL}/api/auth/google/init/?redirect_to=${encodeURIComponent(redirectTo)}`
      });

      const response = await fetch(`${API_BASE_URL}/api/auth/google/init/?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // First, check if the response is OK and get the response text
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Try to parse as JSON, but handle HTML responses gracefully
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        
        // Check if it's an HTML error page
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          if (response.status === 404) {
            throw new Error('Google OAuth endpoint not found (404). Please check your backend routes.');
          } else if (response.status === 500) {
            throw new Error('Server error occurred. Please check your backend logs.');
          } else {
            throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
          }
        } else {
          throw new Error('Invalid response from server');
        }
      }

      console.log('Parsed response data:', data);
      
      if (response.ok && data.url) {
        // Redirect to Google OAuth
        console.log('Redirecting to Google OAuth URL:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error(data.error || data.message || 'Failed to initiate Google signup');
      }
    } catch (err: any) {
      console.error("Google signup error details:", err);
      setError(err.message || "Failed to sign up with Google. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Books - Left Side */}
      <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-48 h-96 opacity-30">
        <div className="absolute left-8 top-0 w-24 h-32 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg rotate-12 transform shadow-lg border border-primary/20"></div>
        <div className="absolute left-16 top-32 w-20 h-28 bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-lg -rotate-6 transform shadow-lg border border-secondary/20"></div>
        <div className="absolute left-4 top-48 w-28 h-36 bg-gradient-to-br from-accent/40 to-accent/20 rounded-lg rotate-3 transform shadow-lg border border-accent/20"></div>
        <div className="absolute left-20 top-64 w-24 h-32 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg -rotate-12 transform shadow-lg border border-primary/20"></div>
      </div>

      {/* Background Books - Right Side */}
      <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-48 h-96 opacity-30">
        <div className="absolute right-8 top-0 w-24 h-32 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg -rotate-12 transform shadow-lg border border-primary/20"></div>
        <div className="absolute right-16 top-32 w-20 h-28 bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-lg rotate-6 transform shadow-lg border border-secondary/20"></div>
        <div className="absolute right-4 top-48 w-28 h-36 bg-gradient-to-br from-accent/40 to-accent/20 rounded-lg -rotate-3 transform shadow-lg border border-accent/20"></div>
        <div className="absolute right-20 top-64 w-24 h-32 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg rotate-12 transform shadow-lg border border-primary/20"></div>
      </div>

      {/* Floating Books for Mobile */}
      <div className="block lg:hidden absolute inset-0 opacity-20">
        <div className="absolute left-4 top-20 w-16 h-20 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg rotate-12 shadow-md"></div>
        <div className="absolute right-4 top-40 w-14 h-18 bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-lg -rotate-6 shadow-md"></div>
        <div className="absolute left-6 bottom-40 w-18 h-24 bg-gradient-to-br from-accent/40 to-accent/20 rounded-lg rotate-3 shadow-md"></div>
        <div className="absolute right-8 bottom-20 w-16 h-20 bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg -rotate-12 shadow-md"></div>
      </div>

      {/* Back to Home Button */}
      <div className="container-custom max-w-7xl mx-auto mb-6 relative z-10">
        <Button
          variant="ghost"
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        {/* Header with Beautiful Gradient */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl mb-3">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Join Our Community
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account and start your reading journey
          </p>
        </div>

        {/* Sign Up Form Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 backdrop-blur-sm bg-card/95">
          {/* Google Sign Up Button */}
          {/* <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full py-3 px-4 text-sm font-medium rounded-lg border-border hover:bg-muted/50 transition-all duration-200"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                  Connecting to Google...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </div>
              )}
            </Button>
          </div> */}

          {/* Divider */}
          {/* <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or continue with email</span>
            </div>
          </div> */}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                        errors.firstName ? "border-destructive" : "border-input"
                      }`}
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={handleInputChange("firstName")}
                      disabled={loading}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                        errors.lastName ? "border-destructive" : "border-input"
                      }`}
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={handleInputChange("lastName")}
                      disabled={loading}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.email ? "border-destructive" : "border-input"
                    }`}
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleInputChange("email")}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.password ? "border-destructive" : "border-input"
                    }`}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={handleInputChange("password")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Must be at least 6 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.confirmPassword ? "border-destructive" : "border-input"
                    }`}
                    placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={toggleConfirmPasswordVisibility}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-input rounded mt-1"
                checked={form.agreeToTerms}
                onChange={handleInputChange("agreeToTerms")}
                disabled={loading}
              />
              <label htmlFor="agreeToTerms" className="text-sm text-foreground">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:text-primary/80 underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:text-primary/80 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-destructive">{errors.agreeToTerms}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 px-4 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800 text-center">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-destructive/15 border border-destructive/20 p-4">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {/* Login link */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80 underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;