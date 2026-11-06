import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(150)
      .regex(/^[\w.@+-]+$/, "invalid input"),
    email: z.email().optional().or(z.literal("")),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
