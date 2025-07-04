import { useState, useEffect } from 'react';
import { useSession } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/lib/anagrafiche-data'; // Import UserProfile

export const useUserRole = () => {
  const { session, loading: sessionLoading } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    if (!session?.user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, allowed_routes') // Select allowed_routes
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } else {
        setUserProfile({
          id: data.id,
          email: session.user.email || '', // Email from session
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          role: data.role,
          allowed_routes: data.allowed_routes || [], // Ensure it's an array
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [session, sessionLoading]);

  return { userProfile, loading };
};