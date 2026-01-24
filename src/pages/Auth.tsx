import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import logoIcon from "@/assets/logo-icon.png";
import { ArrowLeft, Loader2, Chrome, Facebook } from "lucide-react"; // Import Chrome and Facebook
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema, LoginInput, SignupInput, ForgotPasswordInput, ResetPasswordInput } from "@/lib/auth-schemas";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'basic'; // Get plan from URL or default to basic
  const isResetMode = searchParams.get('reset') === 'true'; // Detect reset mode from URL
  const { user, signIn, signUp, signInWithGoogle, signInWithFacebook, resetPassword, updatePassword, onboardingCompleted, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user && !loading && !isResetMode) {
      navigate('/post-login', { replace: true });
    }
  }, [user, loading, navigate, isResetMode]);

  const handleLogin = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      // Error handling is done in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.full_name, data.phone, selectedPlan);
    } catch (error) {
      // Error handling is done in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error handling is done in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithFacebook();
    } catch (error) {
      // Error handling is done in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      await resetPassword(data.email);
      // After successful email send, go back to login
      setTimeout(() => {
        setIsForgotPassword(false);
        forgotPasswordForm.reset();
      }, 2000);
    } catch (error) {
      // Error handling is done in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      await updatePassword(data.password);
    } catch (error) {
      // Error handling is done in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/\D/g, ''); // Remove tudo que não for dígito
    let formattedNumber = '';

    if (phoneNumber.length > 0) {
      formattedNumber = `(${phoneNumber.substring(0, 2)}`;
    }
    if (phoneNumber.length > 2) {
      formattedNumber += `) ${phoneNumber.substring(2, 7)}`;
    }
    if (phoneNumber.length > 7) {
      formattedNumber += `-${phoneNumber.substring(7, 11)}`;
    }
    return formattedNumber;
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary-foreground mb-8 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <Card className="shadow-large">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src="/host-connect-logo-transp.png" alt="HostConnect Logo" className="h-16 w-16 object-contain" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                Bem-vindo ao <span className="bg-gradient-hero bg-clip-text text-transparent">HostConnect</span>
              </CardTitle>
              <CardDescription>
                {isResetMode
                  ? "Defina sua nova senha"
                  : isForgotPassword
                    ? "Recupere sua senha"
                    : isSigningUp
                      ? "Crie sua conta para começar"
                      : "Acesse sua conta"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isResetMode ? (
              <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-password">Nova Senha</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    placeholder="••••••••"
                    {...resetPasswordForm.register("password")}
                    disabled={isLoading}
                  />
                  {resetPasswordForm.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1">
                      {resetPasswordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirmar Nova Senha</Label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    {...resetPasswordForm.register("confirmPassword")}
                    disabled={isLoading}
                  />
                  {resetPasswordForm.formState.errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">
                      {resetPasswordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Redefinir Senha"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/auth', { replace: true })}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Voltar para o login
                  </button>
                </p>
              </form>
            ) : isForgotPassword ? (
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Digite seu email e enviaremos um link para redefinir sua senha.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...forgotPasswordForm.register("email")}
                    disabled={isLoading}
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {forgotPasswordForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Lembrou sua senha?{" "}
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Fazer login
                  </button>
                </p>
              </form>
            ) : !isSigningUp ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...loginForm.register("email")}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                      disabled={isLoading}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    disabled={isLoading}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    )}
                    Facebook
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSigningUp(true);
                      setIsForgotPassword(false);
                    }}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Cadastre-se
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    {...signupForm.register("full_name")}
                    disabled={isLoading}
                  />
                  {signupForm.formState.errors.full_name && (
                    <p className="text-destructive text-sm mt-1">
                      {signupForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...signupForm.register("email")}
                    disabled={isLoading}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    {...signupForm.register("password")}
                    disabled={isLoading}
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-destructive text-sm mt-1">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone (Opcional)</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="(XX) XXXXX-XXXX"
                    {...signupForm.register("phone", {
                      onChange: (e) => {
                        const { value } = e.target;
                        e.target.value = formatPhoneNumber(value);
                      },
                    })}
                    disabled={isLoading}
                  />
                  {signupForm.formState.errors.phone && (
                    <p className="text-destructive text-sm mt-1">
                      {signupForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos{" "}
                  <a href="#" className="text-primary hover:underline">
                    Termos de Serviço
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                  .
                </p>
                <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Conta"}
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    )}
                    Facebook
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSigningUp(false);
                      setIsForgotPassword(false);
                    }}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Faça login
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;