import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { dbConnect } from "@/lib/dbConnect";
import { ImageModel } from "@/model/Image";

export async function GET() {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const images = await ImageModel.find({
      userId: session.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return Response.json(
      {
        success: true,
        images: images.map((img) => ({
          id: img._id,
          title: img.title,
          imageUrl: img.imageUrl,
          prompt: img.prompt,
          createdAt: img.createdAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET_IMAGES_ERROR:", error);
    return Response.json(
      { success: false, message: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
