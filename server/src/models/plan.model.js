import mongoose from "mongoose";
import { BILLING_INTERVALS } from "../utils/billingDate.utils.js";

const planProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "productId is required"],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [150, "Plan name cannot exceed 150 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    products: [planProductSchema],
    // Price in integer minor units (e.g. cents)
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    billingInterval: {
      type: String,
      enum: {
        values: Object.values(BILLING_INTERVALS),
        message: "{VALUE} is not a supported billing interval",
      },
      default: BILLING_INTERVALS.MONTHLY,
      index: true,
    },
    minimumQuantity: {
      type: Number,
      default: 1,
      min: [1, "Minimum quantity must be at least 1"],
    },
    availableFrom: {
      type: Date,
      default: null,
    },
    availableUntil: {
      type: Date,
      default: null,
    },
    autoCloseAtExpiry: {
      type: Boolean,
      default: false,
    },
    allowEarlyClosure: {
      type: Boolean,
      default: true,
    },
    allowPause: {
      type: Boolean,
      default: true,
    },
    allowRenewal: {
      type: Boolean,
      default: true,
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

planSchema.index({ name: "text", description: "text" });

planSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    name: this.name,
    description: this.description || "",
    products: this.products || [],
    price: this.price,
    billingInterval: this.billingInterval,
    minimumQuantity: this.minimumQuantity,
    availableFrom: this.availableFrom,
    availableUntil: this.availableUntil,
    autoCloseAtExpiry: Boolean(this.autoCloseAtExpiry),
    allowEarlyClosure: Boolean(this.allowEarlyClosure),
    allowPause: Boolean(this.allowPause),
    allowRenewal: Boolean(this.allowRenewal),
    isActive: this.isActive !== false,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
