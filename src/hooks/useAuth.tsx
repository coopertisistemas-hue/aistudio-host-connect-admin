import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  onboardingCompleted: boolean; // Added field
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string | null) => Promise<void>; // Adicionado phone
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
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false); // New State
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, plan, onboarding_completed') // Fetch onboarding status
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      setUserRole(null);
      setUserPlan(null);
      setOnboardingCompleted(false);
    } else {
      setUserRole(data?.role || 'user');
      setUserPlan(data?.plan || 'free');
      setOnboardingCompleted(!!data?.onboarding_completed); // Set state
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('[useAuth] User detected, fetching profile...');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('[useAuth] No user session, clearing profile data');
          setUserRole(null);
          setUserPlan(null);
        }
        setLoading(false);
      }
    );

    console.log('[useAuth] Initializing session check...');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[useAuth] Initial session:', session?.user?.email || 'none');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    }).catch(err => {
      console.error('[useAuth] getSession error:', err);
      setLoading(false);
    });

    // Safety timeout: If after 10 seconds we are still loading, force loading to false
    const safetyTimeout = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.error('[useAuth] SAFETY TIMEOUT: Loading took too long (>10s), forcing ready state.');
          return false;
        }
        return currentLoading;
      });
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
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
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string | null) => { // Adicionado phone
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone, // Passando o telefone para user_metadata
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