import mongoose from "mongoose";

const templateProductLineSchema = new mongoose.Schema(
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
      required: [true, "Quantity is required"],
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
  },
  { _id: false }
);

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      maxlength: [150, "Template name cannot exceed 150 characters"],
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "planId is required"],
      index: true,
    },
    productLines: {
      type: [templateProductLineSchema],
      default: [],
    },
    validityDays: {
      type: Number,
      required: [true, "validityDays is required"],
      min: [1, "validityDays must be at least 1 day"],
      max: [365, "validityDays cannot exceed 365 days"],
      default: 30,
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

quotationTemplateSchema.index({ name: "text" });

quotationTemplateSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    name: this.name,
    planId: this.planId,
    productLines: this.productLines || [],
    validityDays: this.validityDays,
    isActive: this.isActive !== false,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const QuotationTemplate = mongoose.model(
  "QuotationTemplate",
  quotationTemplateSchema
);

export default QuotationTemplate;
