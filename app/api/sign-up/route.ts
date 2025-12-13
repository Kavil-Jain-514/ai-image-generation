import { dbConnect } from "@/lib/dbConnect";
import { UserModel } from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, email, password } = await request.json();
    // Check if user already exists
    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingUserVerifiedByUsername) {
      return Response.json(
        { success: false, message: "Username already taken" },
        { status: 400 }
      );
    }
    const existingUserByEmail = await UserModel.findOne({
      email,
    });
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          { success: false, message: "Email already registered" },
          { status: 400 }
        );
      } else {
        // If user exists but is not verified, we can choose to resend the verification code
        const hashedPassword = await bcrypt.hash(password, 10);
        const verifyCodeExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiration = verifyCodeExpiration;
        await existingUserByEmail.save();
      }
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Define verification code expiration
      const verifyCodeExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      // Create new user
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiration,
        isVerified: false,
        plan: "FREE",
        credits: 5,
        stripeCustomerId: undefined,
        stripeSubscriptionId: undefined,
        createdAt: new Date(),
      });
      await newUser.save();
    }
    // Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );
    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message || "Error sending verification email",
        },
        { status: 500 }
      );
    }
    return Response.json(
      {
        success: true,
        message:
          "User registered successfully. Please check your email for the verification code.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return Response.json(
      { success: false, message: "Error registering user" },
      { status: 500 }
    );
  }
}
