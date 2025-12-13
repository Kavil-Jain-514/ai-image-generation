import { z } from "zod";
export const deleteImageSchema = z.object({
  imageId: z.string().min(1),
});
