import mongoose from "mongoose";

export const QUOTATION_STATUS = {
  DRAFT: "Draft",
  QUOTATION: "Quotation",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const PAYMENT_TERMS = {
  IMMEDIATE: "immediate",
  NET_15: "net_15",
  NET_30: "net_30",
  NET_60: "net_60",
};

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: Object.values(QUOTATION_STATUS),
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const quotationLineSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    variantName: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    variantAdjustment: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    effectiveTaxRate: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxBreakdown: [
      {
        taxId: { type: mongoose.Schema.Types.ObjectId, ref: "Tax" },
        name: String,
        rate: Number,
        amount: Number,
      },
    ],
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: [true, "quotationNumber is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "customerId is required"],
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuotationTemplate",
      default: null,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "planId is required"],
      index: true,
    },
    planSnapshot: {
      id: String,
      name: String,
      price: Number,
      billingInterval: String,
      allowPause: Boolean,
      allowRenewal: Boolean,
      allowEarlyClosure: Boolean,
    },
    startDate: {
      type: Date,
      required: [true, "startDate is required"],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "expiryDate is required"],
      index: true,
    },
    paymentTerms: {
      type: String,
      enum: Object.values(PAYMENT_TERMS),
      default: PAYMENT_TERMS.IMMEDIATE,
    },
    lines: [quotationLineSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
      default: null,
    },
    discountSnapshot: {
      id: String,
      name: String,
      type: String,
      value: Number,
      appliedAmount: Number,
    },
    discountTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(QUOTATION_STATUS),
      default: QUOTATION_STATUS.QUOTATION,
      index: true,
    },
    convertedToSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    statusHistory: [statusHistorySchema],
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

quotationSchema.index({ quotationNumber: "text" });

/**
 * Check if the quotation is currently expired based on date and status.
 */
quotationSchema.methods.checkExpiry = function () {
  if (
    this.status !== QUOTATION_STATUS.CONFIRMED &&
    this.status !== QUOTATION_STATUS.CANCELLED &&
    this.status !== QUOTATION_STATUS.EXPIRED
  ) {
    if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
      return true;
    }
  }
  return this.status === QUOTATION_STATUS.EXPIRED;
};

quotationSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    quotationNumber: this.quotationNumber,
    customerId: this.customerId,
    templateId: this.templateId,
    planId: this.planId,
    planSnapshot: this.planSnapshot,
    startDate: this.startDate,
    expiryDate: this.expiryDate,
    paymentTerms: this.paymentTerms,
    lines: this.lines || [],
    subtotal: this.subtotal,
    taxTotal: this.taxTotal,
    discountId: this.discountId,
    discountSnapshot: this.discountSnapshot,
    discountTotal: this.discountTotal,
    grandTotal: this.grandTotal,
    status: this.status,
    convertedToSubscriptionId: this.convertedToSubscriptionId,
    createdBy: this.createdBy,
    statusHistory: this.statusHistory || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
