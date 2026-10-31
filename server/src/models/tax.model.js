import mongoose from "mongoose";

export const TAX_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tax name is required"],
      trim: true,
      maxlength: [100, "Tax name cannot exceed 100 characters"],
    },
    rate: {
      type: Number,
      required: [true, "Tax rate is required"],
      min: [0, "Tax rate cannot be negative"],
      max: [100, "Tax rate cannot exceed 100%"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

taxSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    name: this.name,
    rate: this.rate,
    description: this.description || "",
    isDefault: Boolean(this.isDefault),
    isActive: this.isActive !== false,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Tax = mongoose.model("Tax", taxSchema);
export default Tax;
