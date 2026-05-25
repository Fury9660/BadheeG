import { supabase } from '@/config/supabaseConfig';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  partnerId: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  partnerId: null,
  isLoading: true
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPartnerId = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('pre_approved_partners')
        .select('id')
        .eq('id', userId)
        .single();

      if (data) {
        setPartnerId(data.id);
      } else {
        setPartnerId(null);
      }
    } catch (err) {
      setPartnerId(null);
    }
  };

  useEffect(() => {
    // Safety timeout: If Supabase takes too long (e.g. storage issues), force stop loading after 5s
    const timeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn("Auth check timed out, forcing app load");
          return false;
        }
        return prev;
      });
    }, 5000);

    // Check for initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPartnerId(session.user.id);
        // Ensure profile exists
        const metadata = session.user.user_metadata || {};
        let userName = metadata.full_name || metadata.name || metadata.fullname || 'User';

        // If name is generic 'User', try to find a real name from addresses
        if (userName === 'User') {
          const { data: addressData } = await supabase
            .from('addresses')
            .select('name')
            .eq('user_id', session.user.id)
            .limit(1)
            .maybeSingle();

          if (addressData && addressData.name) {
            userName = addressData.name;
          }
        }

        supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          name: userName,
          updated_at: new Date()
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.log("Profile upsert error:", error);
        });
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPartnerId(session.user.id);
        // Use upsert instead of insert to avoid 409 Conflict
        supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          updated_at: new Date()
        }, { onConflict: 'id' }).then(({ error }) => {
          if (error) console.log("Profile upsert error:", error);
        });
      }
      else setPartnerId(null);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    partnerId,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
