import { z } from "zod";
export const uploadImageSchema = z.object({
  title: z.string().min(3).max(100),
  imageUrl: z.string().url(),
});
