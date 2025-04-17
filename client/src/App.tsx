import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import CoachDetail from "@/pages/RVDetail";
import Sell from "@/pages/Sell";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import FixImagePage from "@/pages/admin/FixImagePage";
import Header from "@/components/layout/Header";
import { AuthContext } from "./main";

function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user exists in localStorage on initial load
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Make sure user has either a role or isAdmin property
        if (!parsedUser.role && parsedUser.isAdmin) {
          parsedUser.role = "admin";
        }

        console.log("App: Loaded user from localStorage:", parsedUser);
        
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Update localStorage with role if it was added
        localStorage.setItem("user", JSON.stringify(parsedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (userData: any) => {
    // Keep the role property if it's already set from the backend
    // Or use isAdmin flag to determine role
    let userToStore = { ...userData };
    
    if (!userToStore.role && userToStore.isAdmin) {
      userToStore.role = "admin";
    }
    
    console.log("App: Logging in user:", userToStore);
    
    setUser(userToStore);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userToStore));
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
              <Route path="/coach/:id" component={CoachDetail} />
              <Route path="/sell" component={Sell} />
              <Route path="/contact" component={Contact} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/fix-images/:id" component={FixImagePage} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Toaster />
        </div>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

export default App;
