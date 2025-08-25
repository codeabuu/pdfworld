import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BookDetail from "./components/BookDetail";
import Releases from "./components/Releases";
import Magazines from "./components/Magazines.tsx";
import Genres from "./components/Genres.tsx";
import Login from "./components/Login.tsx";
import Signup from "./components/Signup.tsx";
import Dashboard from "./components/Dashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      {/* <ScrollHandler> */}
        <Routes>
          <Route path="/" element={<Index />} />
          {/* <Route path="/book/:book_slug" element={<BookDetail />} /> */}
          <Route path="/search" element={<Index />} />
          <Route path="/releases" element={<Releases />} />
          <Route path="/magazines" element={<Magazines />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<div />} />
            <Route path="releases" element={<Releases />} />
            <Route path="genres" element={<Genres />} />
            <Route path="magazines" element={<Magazines />} />
            <Route path="book/:book_slug" element={<BookDetail />} />
            <Route path="genres/:genre_slug" element={<Genres />} />
          </Route>
          {/* Add other routes as needed */}
          {/* Catch-all route for 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      {/* </ScrollHandler> */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

