import { z } from "zod";

export const generateImageSchema = z.object({
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(1000, "Prompt is too long"),

  title: z.string().min(3).max(100).optional(),

  size: z.enum(["512x512", "1024x1024"]).optional().default("1024x1024"),
});
