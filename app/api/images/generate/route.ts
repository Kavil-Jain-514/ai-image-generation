import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/model/User";
import { ImageModel } from "@/model/Image";
import { generateImageSchema } from "@/schemas/generateImageSchema";
import { generateImageTitle } from "@/helpers/generateImageTitle";
import { uploadBase64Image } from "@/helpers/upload";
import { z } from "zod";

const CheckPrompt = z.object({
  prompt: generateImageSchema.shape.prompt,
});

export async function POST(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userID = session.user._id;

  try {
    const body = await request.json();

    const parsedPrompt = CheckPrompt.safeParse({ prompt: body.prompt });
    if (!parsedPrompt.success) {
      const promptErrors = parsedPrompt.error.format().prompt?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            promptErrors.length > 0
              ? promptErrors.join(", ")
              : "Invalid prompt",
        },
        { status: 400 }
      );
    }

    const prompt = parsedPrompt.data.prompt;

    // ✅ ATOMIC CREDIT DEDUCTION (RIGHT HERE)
    const user = await UserModel.findOneAndUpdate(
      { _id: userID, credits: { $gt: 0 } },
      { $inc: { credits: -1 } },
      { new: true }
    );

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "No credits left. Please upgrade your plan.",
        },
        { status: 402 }
      );
    }

    // 🧠 Generate image (getimg.ai)
    const response = await fetch(
      "https://api.getimg.ai/v1/seedream-v4/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GETIMG_API_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!response.ok) {
      // Optional: refund credit here
      await UserModel.updateOne({ _id: userID }, { $inc: { credits: 1 } });

      return Response.json(
        { success: false, message: "Error generating image" },
        { status: 500 }
      );
    }

    const result = await response.json();
    const base64Image = result?.images?.[0]?.image;

    if (!base64Image) {
      throw new Error("Image not returned from getimg.ai");
    }

    const imageUrl = await uploadBase64Image(base64Image);
    const generatedTitle = generateImageTitle(prompt);

    const image = await ImageModel.create({
      userId: user._id,
      title: generatedTitle || prompt.slice(0, 60),
      prompt,
      imageUrl: imageUrl.secure_url,
    });

    return Response.json(
      {
        success: true,
        message: "Image generated successfully",
        data: {
          image: {
            id: image._id,
            title: image.title,
            imageUrl: image.imageUrl,
            prompt: image.prompt,
            createdAt: image.createdAt,
          },
          remainingCredits: user.credits, // already decremented
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("IMAGE_GENERATION_ERROR:", error);
    return Response.json(
      { success: false, message: "Error generating image" },
      { status: 500 }
    );
  }
}
