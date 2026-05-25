import { supabase } from '@/config/supabaseConfig';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  partnerStatus: string | null;
  storeName: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, partnerStatus: null, storeName: null, isLoading: true, signOut: async () => { } });

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPartnerStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pre_approved_partners')
        .select('status, store_name')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setPartnerStatus(data.status);
        setStoreName(data.store_name);
      } else {
        setPartnerStatus('unregistered');
        setStoreName(null);
      }
    } catch (e) {
      console.error("Error fetching partner status", e);
      setPartnerStatus('unregistered');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setPartnerStatus(null);
      setStoreName(null);
    } catch (e) {
      console.error("Error signing out", e);
    }
  };

  useEffect(() => {
    // Check for initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchPartnerStatus(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchPartnerStatus(session.user.id);
      } else {
        setPartnerStatus(null);
        setStoreName(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    partnerStatus,
    storeName,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
