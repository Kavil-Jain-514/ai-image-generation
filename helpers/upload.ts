import cloudinary from "@/lib/cloudinary";

export async function uploadBase64Image(base64: string) {
  return cloudinary.uploader.upload(`data:image/png;base64,${base64}`, {
    folder: "ai-images",
  });
}
