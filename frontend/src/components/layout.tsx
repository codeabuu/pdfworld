// components/Layout.tsx
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  // Remove all the user/subscription fetching logic
  // Remove the ProfileDropdown rendering

  return (
    <div>
      {children}
    </div>
  );
};

export default Layout;