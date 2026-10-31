import mongoose from "mongoose";

export const DISCOUNT_TYPES = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
};

export const DISCOUNT_APPLIES_TO = {
  PRODUCTS: "products",
  SUBSCRIPTION: "subscription",
};

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Discount name is required"],
      trim: true,
      maxlength: [150, "Discount name cannot exceed 150 characters"],
      index: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: Object.values(DISCOUNT_TYPES),
        message: "{VALUE} is not a valid discount type",
      },
      required: [true, "Discount type is required"],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: [0, "minimumPurchase cannot be negative"],
    },
    minimumQuantity: {
      type: Number,
      default: 1,
      min: [1, "minimumQuantity must be at least 1"],
    },
    appliesTo: {
      type: String,
      enum: {
        values: Object.values(DISCOUNT_APPLIES_TO),
        message: "{VALUE} is not a valid discount target",
      },
      default: DISCOUNT_APPLIES_TO.SUBSCRIPTION,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
      index: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
      min: [1, "usageLimit must be at least 1"],
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "usageCount cannot be negative"],
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

discountSchema.index({ name: "text" });

discountSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    name: this.name,
    code: this.code,
    type: this.type,
    value: this.value,
    minimumPurchase: this.minimumPurchase,
    minimumQuantity: this.minimumQuantity,
    appliesTo: this.appliesTo,
    applicableProducts: this.applicableProducts || [],
    startDate: this.startDate,
    endDate: this.endDate,
    usageLimit: this.usageLimit,
    usageCount: this.usageCount,
    isActive: this.isActive !== false,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Discount = mongoose.model("Discount", discountSchema);
export default Discount;
