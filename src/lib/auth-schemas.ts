import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido.").min(1, "O email é obrigatório."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").min(1, "A senha é obrigatória."),
});

export const signupSchema = z.object({
  full_name: z.string().min(1, "O nome completo é obrigatório."),
  email: z.string().email("Email inválido.").min(1, "O email é obrigatório."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres.").min(1, "A senha é obrigatória."),
  phone: z.string().optional().nullable(), // Adicionado campo de telefone (opcional)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido.").min(1, "O email é obrigatório."),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;