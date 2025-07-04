// src/components/auth/SessionContextProvider.tsx
// ...
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'USER_DELETED') {
    // Handle user deleted
    setSession(null);
    setUser(null);
    router.push('/login');
  } else if (event === 'SIGNED_IN') {
    setSession(session);
    setUser(session?.user || null);
  } else if (event === 'SIGNED_OUT') {
    setSession(null);
    setUser(null);
    router.push('/login');
  } else if (event === 'PASSWORD_RECOVERY') {
    // Handle password recovery
  } else if (event === 'MFA_CHALLENGE_VERIFIED') {
    // Handle MFA verified
  }
  // ... other event types
});
// ...