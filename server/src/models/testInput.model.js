import mongoose from "mongoose";

const testInputSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name field is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const TestInput = mongoose.model("test-input", testInputSchema);

export default TestInput;
