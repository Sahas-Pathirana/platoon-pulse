import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      // This will cause a re-render and redirect
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to appropriate dashboard if authenticated
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Cadet Information Management System</h1>
        <p className="text-xl text-muted-foreground mb-8">Manage your school cadet platoon information efficiently</p>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">Access the system to view and manage cadet records</p>
          <a 
            href="/auth" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Login to System
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
