// components/ProfileDropdown.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  ChevronDown,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { authService } from "@/services/Myauthservice";
import { subscriptionService } from "@/services/subservice";
import { useToast } from "@/components/ui/use-toast";

interface ProfileDropdownProps {
  user: any;
  subscription: any;
}

const ProfileDropdown = ({ user, subscription }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPlanBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-xs">Active</Badge>;
      case "trialing":
        return <Badge className="bg-blue-600 text-xs">Free Trial</Badge>;
      case "past_due":
        return <Badge className="bg-amber-600 text-xs">Past Due</Badge>;
      case "canceled":
        return (
          <Badge variant="outline" className="text-xs">
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Inactive
          </Badge>
        );
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsOpen(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-amber-600" />
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription ? (
                    <span className="flex items-center gap-1">
                      {getPlanBadge(subscription.status)}
                      {subscription.status === "trialing" && "Trial"}
                    </span>
                  ) : (
                    "Free Plan"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Subscription
              </span>
              {subscription && getPlanBadge(subscription.status)}
            </div>

            {subscription?.status === "trialing" && subscription.trial_end && (
              <p className="text-xs text-muted-foreground">
                Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => {
                navigate("/subscription");
                setIsOpen(false);
              }}
            >
              <CreditCard className="h-3 w-3 mr-2" />
              Manage Subscription
            </Button>
          </div>

          {/* Settings Links */}
          <div className="px-4 py-2 border-b border-gray-100">
            <button
              className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md"
              onClick={() => {
                navigate("/testprofile");
                setIsOpen(false);
              }}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Profile & Settings
            </button>

            <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </button>

            <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-foreground hover:bg-amber-50 rounded-md">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Help & FAQ
            </button>
          </div>

          {/* Logout */}
          <div className="px-4 py-2">
            <button
              className="w-full flex items-center gap-3 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;