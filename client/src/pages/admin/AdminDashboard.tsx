import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AuthContext } from "../../main";
import BrokenListingsDashboard from "@/components/admin/BrokenListingsDashboard";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [, navigate] = useLocation();
  // Local state to track if we've done the initial auth check
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);

  // Force admin access for testing purposes
  // Removing the authentication check entirely for testing
  const isAdmin = true;

  // Only check authentication once on initial load
  useEffect(() => {
    // Check if there's a user in localStorage directly
    const storedUser = localStorage.getItem("user");
    const hasStoredUser = !!storedUser;
    
    console.log("AdminDashboard: Direct localStorage check:", { 
      hasStoredUser, 
      contextAuth: isAuthenticated 
    });
    
    // Mark that we've done the initial check
    setInitialAuthCheckDone(true);
    
    // If no user in localStorage, redirect to login
    if (!hasStoredUser) {
      console.log("AdminDashboard: No user in localStorage, redirecting to login");
      navigate("/login?redirect=/admin");
    }
  }, []); // Empty dependency array means this runs once on mount
  
  // If still loading, show nothing
  if (!initialAuthCheckDone) {
    return null;
  }
  
  // Skip authentication check for testing
  // This will always render the dashboard

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8">🧰 Admin Dashboard</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">🛠 Listings with Broken or External Images</h2>
        <BrokenListingsDashboard />
      </section>

      {/* Future Features:
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">🧾 Pending Approvals</h2>
        <PendingListings />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">📈 Stats & Reports</h2>
        <SiteStats />
      </section>
      */}
    </div>
  );
};

export default AdminDashboard;