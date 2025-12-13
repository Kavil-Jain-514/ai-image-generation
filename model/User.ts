import mongoose, { Schema, Document } from "mongoose";

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  verifyCode: string;
  verifyCodeExpiration: Date;
  isVerified?: boolean;
  plan: "FREE" | "PRO";
  credits: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
}

const UserSchema: Schema<User> = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    verifyCode: {
      type: String,
      required: [true, "Verification code is required"],
    },
    verifyCodeExpiration: {
      type: Date,
      required: [true, "Verification code expiration is required"],
      default: Date.now,
    },
    isVerified: { type: Boolean, default: false },
    plan: { type: String, enum: ["FREE", "PRO"], default: "FREE" },
    credits: { type: Number, default: 5 },

    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  { timestamps: true }
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);
