import mongoose from "mongoose";

export const PRODUCT_TYPES = {
  SERVICE: "service",
  PHYSICAL: "physical",
  DIGITAL: "digital",
};

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Variant name is required"],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    // priceAdjustment in minor units (e.g. cents, +500 or -200)
    priceAdjustment: {
      type: Number,
      default: 0,
    },
    attributes: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: Object.values(PRODUCT_TYPES),
        message: "{VALUE} is not a supported product type",
      },
      default: PRODUCT_TYPES.SERVICE,
      index: true,
    },
    // Monetary values stored in minor units (cents / integer)
    salesPrice: {
      type: Number,
      required: [true, "Sales price is required"],
      min: [0, "Sales price cannot be negative"],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, "Cost price cannot be negative"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    taxIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tax",
      },
    ],
    variants: [variantSchema],
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

productSchema.index({ name: "text", notes: "text" });

productSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    name: this.name,
    type: this.type,
    salesPrice: this.salesPrice,
    costPrice: this.costPrice,
    notes: this.notes || "",
    taxIds: this.taxIds || [],
    variants: this.variants || [],
    isActive: this.isActive !== false,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Product = mongoose.model("Product", productSchema);
export default Product;
