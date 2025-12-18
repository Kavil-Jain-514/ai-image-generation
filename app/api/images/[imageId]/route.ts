import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { dbConnect } from "@/lib/dbConnect";
import { ImageModel } from "@/model/Image";
import cloudinary from "@/lib/cloudinary";
import { deleteImageSchema } from "@/schemas/deleteImageSchema";
import { z } from "zod";

export async function DELETE(
  request: Request,
  { params }: { params: { imageId: string } }
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  //  Validate imageId
  const parsed = deleteImageSchema.safeParse({
    imageId: params.imageId,
  });

  if (!parsed.success) {
    return Response.json(
      { success: false, message: "Invalid image ID" },
      { status: 400 }
    );
  }

  const userId = session.user._id;
  const imageId = parsed.data.imageId;

  // ✅ Ensure image belongs to user
  const image = await ImageModel.findOne({
    _id: imageId,
    userId,
  });

  if (!image) {
    return Response.json(
      { success: false, message: "Image not found" },
      { status: 404 }
    );
  }

  try {
    //  Delete from Cloudinary
    const publicId = image.imageUrl
      .split("/")
      .slice(-2)
      .join("/")
      .split(".")[0]; // ai-images/filename

    await cloudinary.uploader.destroy(publicId);

    //  Delete from DB
    await ImageModel.deleteOne({ _id: imageId });

    return Response.json(
      { success: true, message: "Image deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE_IMAGE_ERROR:", error);
    return Response.json(
      { success: false, message: "Failed to delete image" },
      { status: 500 }
    );
  }
}
