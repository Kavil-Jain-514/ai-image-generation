import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/model/User";
import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";

const CheckUsernameSchema = z.object({
  username: usernameValidation,
});

export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const queryParam = { username: searchParams.get("username") };
    const parsedData = CheckUsernameSchema.safeParse(queryParam);
    console.log("Parsed Data:", parsedData);
    if (!parsedData.success) {
      const usernameErrors = parsedData.error.format().username?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            usernameErrors?.length > 0
              ? usernameErrors.join(", ")
              : "Invalid username",
          errors: usernameErrors,
        },
        { status: 400 }
      );
    }
    const { username } = parsedData.data;
    const existingUser = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken",
        },
        { status: 400 }
      );
    } else {
      return Response.json(
        { success: true, message: "Username is available" },
        { status: 200 }
      );
    }
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Error checking username uniqueness",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
