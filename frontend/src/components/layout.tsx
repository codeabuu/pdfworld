// components/Layout.tsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProfileDropdown from "./profiledropdown";
import { authService } from "@/services/Myauthservice";
import { subscriptionService } from "@/services/subservice";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const location = useLocation();

  // Only show profile on certain pages
  const showProfile = ["/pricing", "/dashboard", "/subscription"].includes(
    location.pathname
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (!showProfile) return;
      
      try {
        const isAuth = await authService.checkAuth();
        if (!isAuth) return;

        const userId = authService.getUserId();
        if (!userId) return;

        try {
          const res = await axios.get(`${API_BASE_URL}/api/me/`);
          const userData = res.data.user || res.data;
          const userEmail = userData.email || "Unknown";

          setUser({
            id: userId,
            email: userEmail,
            created_at: userData.created_at,
          });

          const subData = await subscriptionService.checkSubscriptionStatus(userId);
          setSubscription(subData);
        } catch (err) {
          console.error("Failed to fetch user/subscription:", err);
          setUser({
            id: userId,
            email: "Unknown",
          });
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    };

    fetchUserData();
  }, [showProfile, location]);

  return (
    <div>
      {showProfile && (
        <div className="fixed top-4 right-4 z-50">
          <ProfileDropdown user={user} subscription={subscription} />
        </div>
      )}
      {children}
    </div>
  );
};

export default Layout;