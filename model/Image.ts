import mongoose, { Schema, Document } from "mongoose";

export interface Image extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
}

const ImageSchema = new Schema<Image>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    prompt: { type: String },
  },
  { timestamps: true }
);

export const ImageModel =
  (mongoose.models.Image as mongoose.Model<Image>) ||
  mongoose.model<Image>("Image", ImageSchema);
