import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import RVDetail from "@/pages/RVDetail";
import Sell from "@/pages/Sell";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import FixImagePage from "@/pages/admin/FixImagePage";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthContext } from "./main";

function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user exists in localStorage on initial load
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // For demonstration purposes, let's make all users admin
      // In a real app, this would be determined by the backend
      if (!parsedUser.role) {
        parsedUser.role = "admin";
      }
      
      setUser(parsedUser);
      setIsAuthenticated(true);
      
      // Update localStorage with role if it was added
      localStorage.setItem("user", JSON.stringify(parsedUser));
    }
  }, []);

  const login = (userData: any) => {
    // For demonstration purposes, let's give admin role to all users
    // In a real app, this would be determined by the backend
    const userWithRole = { ...userData, role: "admin" };
    
    setUser(userWithRole);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userWithRole));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/browse" component={Browse} />
              <Route path="/rv/:id" component={RVDetail} />
              <Route path="/sell" component={Sell} />
              <Route path="/contact" component={Contact} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/fix-images/:id" component={FixImagePage} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <Toaster />
        </div>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

export default App;
