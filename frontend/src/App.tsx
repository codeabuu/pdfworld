import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BookDetail from "./components/BookDetail";
import Releases from "./components/Releases";
import Magazines from "./components/Magazines.tsx";
import Genres from "./components/Genres.tsx";
import Login from "./components/Login.tsx";
import Signup from "./components/Signup.tsx";
import Dashboard from "./components/Dashboard.tsx";
import ProtectedRoute from "./components/Protectedroute.tsx";
import StartTrial from "./components/Starttrial.tsx";
import Profile from "./components/Profile.tsx";
import PricingPage from "./pages/PricingPg.tsx";
import Header from "./components/Header.tsx";
import { useState } from "react";

const queryClient = new QueryClient();


// Dashboard Layout component that includes the nested routes
const DashboardLayout = () => {
  return (
    <Dashboard>
      <Outlet /> {/* This renders the nested routes */}
    </Dashboard>
  );
};

const MainLayout = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const handleSearch = (results: any[]) => {
    setSearchResults(results);
  };

  return (
    <div className="min-h-screen">
      <Header onSearch={handleSearch} />
      <main>
        <Outlet context={{ searchResults }} />
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      
        <Routes>
          <Route path="/testprofile" element={<Profile />} />
          <Route path="/" element={<Index />} />
          <Route element={<MainLayout />}>
            <Route path="/search" element={<Index />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/magazines" element={<Magazines />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/start-trial" element={<StartTrial />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

          {/* Protected Dashboard Routes */}
          {/* <Route path="/dashboard/" element={<Navigate to="/dashboard" replace />} /> */}
          <Route path="/dashboard" element={
            <ProtectedRoute requireSubscription={true}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* <Route index element={<div>Dashboard Home - Add your content here</div>} /> */}
            <Route path="releases" element={<Releases />} />
            <Route path="genres" element={<Genres />} />
            <Route path="magazines" element={<Magazines />} />
            <Route path="book/:book_slug" element={<BookDetail />} />
            <Route path="genres/:genre_slug" element={<Genres />} />
            <Route path="/dashboard/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          
          {/* Add other routes as needed */}
          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;