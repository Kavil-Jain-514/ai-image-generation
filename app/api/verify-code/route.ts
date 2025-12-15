import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/model/User";
import { z } from "zod";
import { verifySchema } from "@/schemas/verifySchema";

const CheckVerifyCode = z.object({
  verifyCode: verifySchema,
});

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { verifyCode, username } = await request.json();
    const verifiedCode = CheckVerifyCode.safeParse({ verifyCode });
    if (!verifiedCode.success) {
      const codeErrors = verifiedCode.error.format().verifyCode?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            codeErrors.length > 0
              ? codeErrors.join(", ")
              : "Invalid verification code",
          errors: codeErrors,
        },
        { status: 400 }
      );
    }
    const decodedUsername = decodeURIComponent(username);
    const user = await UserModel.findOne({ username: decodedUsername });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    const isCodeValid = user.verifyCode === verifyCode;
    const isCodeNotExpired =
      user.verifyCodeExpiration && user.verifyCodeExpiration > new Date();
    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true;
      await user.save();
      return Response.json(
        { success: true, message: "User verified successfully" },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      return Response.json(
        { success: false, message: "Verification code has expired" },
        { status: 400 }
      );
    } else {
      return Response.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Error verifying code",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
