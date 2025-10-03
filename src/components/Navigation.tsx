import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Shield, User } from "lucide-react";

export const Navigation = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between gap-2 py-2 sm:py-0 sm:h-16">
          <div className="flex items-center justify-center sm:justify-start">
            <h1 className="text-base sm:text-xl font-semibold text-foreground">
              Cadet Management System
            </h1>
          </div>
          
          <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4 flex-wrap">
            {user && (
              <>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  {user.role === 'admin' ? (
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-none">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap">
                    {user.role === 'admin' ? 'Admin' : 'Cadet'}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Sign Out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};