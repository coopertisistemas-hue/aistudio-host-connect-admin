import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types'; // Import Tables type
import { trackLogin } from '@/lib/analytics'; // Analytics

type Profile = Tables<'profiles'>; // Define Profile type

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userPlan: string | null;
  onboardingCompleted: boolean | null; // Changed to boolean | null (tri-state)
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string | null, plan?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>; // New: Google sign-in
  signInWithFacebook: () => Promise<void>; // New: Facebook sign-in
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => { // Corrected type for children
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null); // Initialized as null (unknown)
  const navigate = useNavigate();

  const fetchInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timers = useRef<Record<string, number>>({});

  const startTimer = (timerId: string) => {
    if (timers.current[timerId]) {
      delete timers.current[timerId];
    }
    timers.current[timerId] = performance.now();
  };

  const endTimer = (timerId: string) => {
    if (timers.current[timerId]) {
      const duration = performance.now() - timers.current[timerId];
      console.log(`[useAuth] ${timerId}: ${duration.toFixed(2)} ms`);
      delete timers.current[timerId];
    }
  };

  const fetchUserProfile = async (userId: string) => {
    if (fetchInProgress.current) {
      console.log('[useAuth] Fetch already in progress, skipping redundant request.');
      return;
    }

    const timerId = `fetchProfile-${userId}`;

    try {
      fetchInProgress.current = true;
      startTimer(timerId);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 20000);

      const { data, error } = await supabase
        .from('profiles')
        .select('role, plan, onboarding_completed')
        .eq('id', userId)
        .abortSignal(signal)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[useAuth] Profile not found for user:', userId);
        } else if (error.name === 'AbortError' || (error as any).message === 'AbortError') {
          console.warn(`[useAuth] Profile fetch timed out after 20s or was aborted. userId: ${userId}`);
        } else {
          console.error('[useAuth] Error fetching user profile:', error);
        }
        setUserRole(null);
        setUserPlan(null);
        setOnboardingCompleted(null);
      } else {
        setUserRole(data?.role || 'user');
        setUserPlan(data?.plan || 'free');
        const isCompleted = !!data?.onboarding_completed;
        setOnboardingCompleted(isCompleted);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        console.warn(`[useAuth] Profile fetch aborted for user: ${userId}`);
      } else {
        console.error('[useAuth] Unexpected error in fetchUserProfile:', e);
      }
    } finally {
      endTimer(timerId);
      fetchInProgress.current = false;
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    const authListener = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        console.log('[useAuth] Auth Event:', event);

        if (session?.user) {
          // Only fetch profile on specific events to prevent excessive reloading
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            // Reset Session Lock state on every fresh sign-in or session restoration
            if (event === 'SIGNED_IN') {
              console.log('[useAuth] Resetting Session Lock state');
              localStorage.removeItem('hc_session_locked');
              localStorage.setItem('hc_last_active', Date.now().toString());
            }
            await fetchUserProfile(session.user.id);
          } else {
            setLoading(false);
          }
        } else {
          setUserRole(null);
          setUserPlan(null);
          setOnboardingCompleted(null);
          setLoading(false);
        }
      }
    );

    const initAuth = async () => {
      try {
        console.log('[useAuth] initAuth starting...');
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[useAuth] Session error in initAuth:', sessionError);
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          console.log('[useAuth] Session found, fetching profile...');
          await fetchUserProfile(currentSession.user.id);
        } else {
          console.log('[useAuth] No session found in initAuth');
          setLoading(false);
        }
      } catch (err) {
        console.error('[useAuth] Unexpected initAuth error:', err);
        setLoading(false);
      }
    };

    initAuth();

    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 6000);

    return () => {
      authListener.data.subscription.unsubscribe();
      clearTimeout(safetyTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erro de login",
            description: "Email ou senha incorretos",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: error.message,
            variant: "destructive",
          });
        }
        throw error;
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta ao HostConnect",
      });

      // Fetch profile after successful sign-in
      const { data: { user: loggedInUser } } = await supabase.auth.getUser();
      if (loggedInUser) {
        await fetchUserProfile(loggedInUser.id);
      }

      trackLogin('email'); // Track login
      // navigate('/dashboard'); // Removed to allow Auth.tsx to handle redirect based on onboarding
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string | null, plan?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            plan: plan || 'basic', // Pass plan to user_metadata for trigger
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Erro de cadastro",
            description: "Este email já está cadastrado. Faça login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: error.message,
            variant: "destructive",
          });
        }
        throw error;
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      trackLogin('signup_email'); // Track signup

      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso. Redirecionando...",
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Sessão encerrada",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/auth');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`, // Redirect back to auth page to handle session
        },
      });
      trackLogin('google_attempt');

      if (error) {
        toast({
          title: "Erro no Login com Google",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      // Supabase will handle the redirect and onAuthStateChange will pick up the session
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      trackLogin('facebook_attempt');

      if (error) {
        toast({
          title: "Erro no Login com Facebook",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, userPlan, onboardingCompleted, signIn, signUp, signOut, signInWithGoogle, signInWithFacebook }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};