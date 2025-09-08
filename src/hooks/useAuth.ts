import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AuthUser extends User {
  role?: 'admin' | 'student';
  cadet_id?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    let hasInitialized = false;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isSubscribed) return;
        
        // Only log on actual changes, not initialization
        if (hasInitialized) {
          console.log('Auth state change:', event, session?.user?.email);
        }
        
        setSession(session);
        
        if (session?.user) {
          // Fetch profile to get role
          supabase
            .from('user_profiles')
            .select('role, cadet_id')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data: profile, error }) => {
              if (!isSubscribed) return;
              
              if (error) {
                console.error('Error fetching profile:', error);
                // Default to student role if profile fetch fails
                setUser({
                  ...session.user,
                  role: 'student'
                } as AuthUser);
              } else {
                setUser({
                  ...session.user,
                  role: profile?.role || 'student',
                  cadet_id: profile?.cadet_id || undefined,
                } as AuthUser);
              }
              setLoading(false);
            });
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session (only once)
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!isSubscribed) return;
      hasInitialized = true;
      
      if (error) {
        console.error('Session error:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      // Don't set session here as the auth state listener will handle it
      if (!session) {
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, regimentNumber?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          regiment_number: regimentNumber,
        },
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Please check your email to confirm your account.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};