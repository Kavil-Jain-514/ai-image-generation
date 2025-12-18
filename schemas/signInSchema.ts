import { z } from "zod";

export const signInSchema = z.object({
  identifier: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must be at most 20 characters long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be at most 100 characters long"),
});

// export type SignInInput = z.infer<typeof signInSchema>;
