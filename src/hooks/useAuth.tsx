import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types'; // Import Tables type
import { trackLogin } from '@/lib/analytics'; // Analytics
import { safeLogger } from '@/lib/logging/safeLogger';

type Profile = Tables<'profiles'>; // Define Profile type

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userPlan: string | null;
  isSuperAdmin: boolean; // ✅ Super admin flag
  profileError: 'not_found' | 'forbidden' | 'error' | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string | null, plan?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  debugTrace: QueryTrace | null;
}

export interface QueryTrace {
  name: string;
  table: string;
  select: string;
  filters: { column: string; op: string }[];
  modifiers: Record<string, any>;
  startedAtMs: number;
  endedAtMs?: number;
  outcome?: string;
  durationMs?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => { // Corrected type for children
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false); // ✅ Super admin state
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null); // Initialized as null (unknown)
  const [profileError, setProfileError] = useState<'not_found' | 'forbidden' | 'error' | null>(null);
  const [debugTrace, setDebugTrace] = useState<QueryTrace | null>(null);
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
      safeLogger.debug('auth.profile.timer', { durationMs: Number(duration.toFixed(2)) });
      delete timers.current[timerId];
    }
  };

  const fetchUserProfile = async (userId: string) => {
    if (fetchInProgress.current) {
      safeLogger.debug('auth.profile.skip_duplicate');
      return;
    }

    const timerId = `fetchProfile-${userId}`;
    const start = performance.now();
    let outcome = 'unknown';

    // 1. Set Debug Trace (Pre-fetch)
    setDebugTrace({
      name: 'fetchUserProfile',
      table: 'profiles',
      select: 'role, plan, onboarding_completed', // removed is_super_admin to test stall
      filters: [{ column: 'id', op: 'eq' }],
      modifiers: { maybeSingle: true },
      startedAtMs: start
    });

    try {
      fetchInProgress.current = true;
      safeLogger.info('profile.fetch_start', { method: 'fetchUserProfile' }); // Start log
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

      // Timeout externo: Promise.race para garantir que fallback seja acionado
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 8000); // 8 segundos
      });

      const queryPromise = supabase
        .from('profiles')
        .select('role, plan, onboarding_completed') // Removed is_super_admin to test stall
        .eq('id', userId)
        .maybeSingle();

      let data: any = null;
      let error: any = null;
      let profile: any = null;

      try {
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        data = result.data;
        error = result.error;
        profile = data;
      } catch (timeoutError: any) {
        if (timeoutError.message === 'TIMEOUT') {
          outcome = 'timeout_using_defaults';
          safeLogger.warn('profile.timeout_fallback', { waitedMs: 8000 });

          // Fallback seguro: permite acesso com permissões mínimas
          setProfileError(null);
          setUserRole('user');
          setUserPlan('free');
          setIsSuperAdmin(false);
          setOnboardingCompleted(true);

          const durationMs = performance.now() - start;
          safeLogger.info('profile.fetch_end', { outcome, durationMs: Number(durationMs.toFixed(2)) });
          setDebugTrace(prev => prev ? ({ ...prev, endedAtMs: performance.now(), outcome, durationMs }) : null);
          return;
        }
        throw timeoutError;
      }

      // DIAGNOSTIC START: Bypass is_super_admin if debug mode is on
      const isDebug = localStorage.getItem('hc_debug_queries') === '1';
      let isSuperAdminValue = false;

      if (isDebug) {
        isSuperAdminValue = true;
        safeLogger.warn('post_login.debug_super_admin_defaulted', { enabled: true });
      } else {
        isSuperAdminValue = (data as any)?.is_super_admin;
      }
      // DIAGNOSTIC END

      if (error) {
        // RLS Policy bloqueada - usar defaults seguros
        if (error.code === '42501' || error.message.includes('policy')) {
          outcome = 'rls_blocked_using_defaults';
          safeLogger.warn('profile.rls_blocked_fallback', { code: error.code });

          // Fallback seguro: permite acesso com permissões mínimas
          setProfileError(null);
          setUserRole('user');
          setUserPlan('free');
          setIsSuperAdmin(false);
          setOnboardingCompleted(true); // Assume onboarding completo para não bloquear

        } else {
          outcome = 'error';
          safeLogger.error('profile.fetch_result', { outcome, message: error.message });
          setProfileError('error');
          setUserRole(null);
          setUserPlan(null);
          setOnboardingCompleted(null);
        }
      } else if (!profile) {
        // Profile não encontrado - usar defaults seguros (mesmo comportamento que RLS bloqueada)
        outcome = 'not_found_using_defaults';
        safeLogger.warn('profile.not_found_fallback');

        // Fallback seguro: permite acesso com permissões mínimas
        setProfileError(null);
        setUserRole('user');
        setUserPlan('free');
        setIsSuperAdmin(false);
        setOnboardingCompleted(true); // Assume onboarding completo para não bloquear

      } else {
        outcome = 'ok';
        // safeLogger.info('profile.fetch_result', { outcome }); // Logged in finally
        setProfileError(null);
        setUserRole(profile?.role || 'user');
        setUserPlan(profile?.plan || 'free');
        setIsSuperAdmin(!!isSuperAdminValue); // ✅ Set super admin flag (diagnostic override)
        const isCompleted = !!profile?.onboarding_completed;
        setOnboardingCompleted(isCompleted);
      }
    } catch (e: any) {
      outcome = 'sys_error';
      safeLogger.error('auth.profile.unexpected_error', { message: e?.message });
      setProfileError('error');
    } finally {
      const durationMs = performance.now() - start;
      safeLogger.info('profile.fetch_end', { outcome, durationMs: Number(durationMs.toFixed(2)) });

      // 2. Update Debug Trace (Post-fetch)
      setDebugTrace(prev => prev ? ({ ...prev, endedAtMs: performance.now(), outcome, durationMs }) : null);

      endTimer(timerId);
      fetchInProgress.current = false;
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  useEffect(() => {
    const authListener = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);

          safeLogger.info('auth.state_change', { event });

          if (session?.user) {
            // Only fetch profile on specific events to prevent excessive reloading
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
              // Reset Session Lock state on every fresh sign-in or session restoration
              if (event === 'SIGNED_IN') {
                safeLogger.info('auth.session_lock.reset');
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
            setIsSuperAdmin(false);
            setOnboardingCompleted(null);
            setLoading(false);
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            safeLogger.warn('auth.state_change.aborted');
          } else {
            safeLogger.error('auth.state_change.error', { message: err?.message });
          }
          setLoading(false);
        }
      }
    );

    const initAuth = async () => {
      try {
        safeLogger.info('auth.init.start');
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          safeLogger.error('auth.init.session_error', { message: sessionError.message });
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          safeLogger.info('auth.init.session_found');
          await fetchUserProfile(currentSession.user.id);
        } else {
          safeLogger.info('auth.init.no_session');
          setLoading(false);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          safeLogger.warn('auth.init.aborted');
        } else {
          safeLogger.error('auth.init.error', { message: err?.message });
        }
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
      safeLogger.error('auth.sign_in.error', { message: (error as Error).message });
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
        navigate('/post-login', { replace: true });
      }, 1000);
    } catch (error) {
      safeLogger.error('auth.sign_up.error', { message: (error as Error).message });
      throw error;
    }
  };

  const signOut = async () => {
    safeLogger.info('auth.sign_out.start');
    try {
      // 1. Optimistic Clean-up: Clear local state IMMEDIATELY
      safeLogger.debug('auth.sign_out.clear_state');
      setUser(null);
      setSession(null);
      setUserRole(null);
      setUserPlan(null);
      setIsSuperAdmin(false);
      setOnboardingCompleted(null);
      setProfileError(null);

      // Clear localStorage items manually just in case
      localStorage.removeItem('hc_session_locked');
      localStorage.removeItem('supabase.auth.token'); // Adjust key if needed, or let supabase handle it

      toast({
        title: "Sessão encerrada",
        description: "Você foi desconectado.",
      });

      // 2. Navigate away immediately
      safeLogger.debug('auth.sign_out.navigate');
      navigate('/auth');

      // 3. Call Supabase SignOut (don't block UI if this hangs)
      safeLogger.debug('auth.sign_out.supabase');
      const { error } = await supabase.auth.signOut();
      if (error) {
        safeLogger.warn('auth.sign_out.supabase_error', { message: error.message });
      } else {
        safeLogger.info('auth.sign_out.success');
      }

    } catch (error: any) {
      safeLogger.error('auth.sign_out.critical_error', { message: (error as Error).message });
      // Force navigation anyway
      navigate('/auth');
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
      safeLogger.error('auth.google.error', { message: (error as Error).message });
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
      safeLogger.error('auth.facebook.error', { message: (error as Error).message });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, userPlan, isSuperAdmin, onboardingCompleted, signIn, signUp, signOut, signInWithGoogle, signInWithFacebook, profileError, debugTrace }}>
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
