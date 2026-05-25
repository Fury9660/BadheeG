import { supabase } from '@/config/supabaseConfig';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  partnerStatus: string | null;
  partnerId: string | null;
  isLoading: boolean;
  refreshPartnerStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  partnerStatus: null,
  partnerId: null,
  isLoading: true,
  refreshPartnerStatus: async () => { }
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPartnerStatus = async (userObj: User) => {
    try {
      console.log("Fetching partner status for user_id:", userObj.id, "and Phone:", userObj.phone);

      // 1. Try calling the RPC function first (for automated linking & setup)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('link_partner_by_phone');
        if (rpcError) {
          console.warn("RPC link_partner_by_phone failed or not present:", rpcError.message);
        } else if (rpcData && rpcData.success) {
          console.log("Successfully linked partner via RPC. Partner ID:", rpcData.partner_id);
          setPartnerId(rpcData.partner_id);
        } else {
          console.log("RPC link result:", rpcData);
        }
      } catch (rpcErr) {
        console.error("Error executing RPC:", rpcErr);
      }

      // 2. Try querying by user_id (for returning users)
      const { data: idData, error: idError } = await supabase
        .from('pre_approved_partners')
        .select('id, status')
        .eq('user_id', userObj.id)
        .maybeSingle();

      if (idError) {
        console.error("Supabase error fetching by user_id:", idError);
      }

      if (idData) {
        console.log("Partner status found by user_id:", idData.status);
        setPartnerId(idData.id);
        setPartnerStatus(idData.status?.toLowerCase() || 'approved');
        return;
      }

      // 3. Try querying by Phone/Email if user_id fetch found nothing (for first-time login)
      let query = supabase.from('pre_approved_partners').select('id, status, user_id');

      if (userObj.phone) {
        const cleanPhone = userObj.phone.replace('+91', '').replace(/\D/g, '').slice(-10);
        query = query.eq('mobile_number', cleanPhone);
      } else if (userObj.email && !userObj.email.endsWith('@badheeg.com')) {
        query = query.ilike('email', userObj.email);
      } else {
        console.warn("No valid email or phone found for user to search by");
        setPartnerId(null);
        setPartnerStatus('unregistered');
        return;
      }

      const { data: preData, error: preError } = await query.maybeSingle();

      if (preError) {
        console.error("Supabase error fetching partner status by phone/email:", preError);
        setPartnerId(null);
        setPartnerStatus('error');
        return;
      }

      if (preData) {
        console.log("Partner status found by phone/email:", preData.status);
        setPartnerId(preData.id);
        
        // Link the auth user to the pre-approved partner record if user_id is null
        if (!preData.user_id) {
          console.log("Linking partner record", preData.id, "to auth user ID:", userObj.id);
          const { error: updateError } = await supabase
            .from('pre_approved_partners')
            .update({ user_id: userObj.id })
            .eq('id', preData.id);

          if (updateError) {
            console.error("Failed to link partner user_id in database:", updateError.message);
          } else {
            console.log("Successfully linked partner record to auth user ID.");
          }
        }

        setPartnerStatus(preData.status?.toLowerCase() || 'approved');
      } else {
        console.log("No partner record found for phone/email, setting as unregistered");
        setPartnerId(null);
        setPartnerStatus('unregistered');
      }
    } catch (e) {
      console.error("Unexpected error fetching partner status:", e);
      setPartnerId(null);
      setPartnerStatus('error');
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Check for initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && isMounted) {
          setSession(session);
          setUser(session.user);
          await fetchPartnerStatus(session.user);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setIsLoading(true); // Set loading while we fetch status for new auth state
        await fetchPartnerStatus(session.user);
        setIsLoading(false);
      } else {
        setPartnerId(null);
        setPartnerStatus(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    partnerStatus,
    partnerId,
    isLoading,
    refreshPartnerStatus: async () => {
      if (user) await fetchPartnerStatus(user);
    }
  };

  useEffect(() => {
    let subscription: any;

    if (user) {
      // Subscribe to realtime changes for this user's status via user_id
      subscription = supabase
        .channel(`public:pre_approved_partners:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pre_approved_partners',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Realtime status update:', payload.new.status);
            setPartnerId(payload.new.id);
            setPartnerStatus(payload.new.status?.toLowerCase() || 'approved');
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
