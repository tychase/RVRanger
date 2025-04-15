import { useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthContext } from "../../main";
import BrokenListingsDashboard from "@/components/admin/BrokenListingsDashboard";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [, navigate] = useLocation();

  // Check if user is admin
  const isAdmin = isAuthenticated && (user?.isAdmin || user?.role === "admin");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/admin");
    } else if (!isAdmin) {
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // If not authenticated or not admin, don't render the dashboard
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">
            You need administrator privileges to access this page.
          </p>
          <Button onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

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