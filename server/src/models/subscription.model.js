import mongoose from "mongoose";
import { BILLING_INTERVALS } from "../utils/billingDate.utils.js";
import { PAYMENT_TERMS } from "./quotation.model.js";

export const SUBSCRIPTION_STATUS = {
  DRAFT: "Draft",
  QUOTATION: "Quotation",
  CONFIRMED: "Confirmed",
  ACTIVE: "Active",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: Object.values(SUBSCRIPTION_STATUS),
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

const subscriptionLineSchema = new mongoose.Schema(
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

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
      type: String,
      required: [true, "subscriptionNumber is required"],
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
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "planId is required"],
      index: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      default: null,
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
    billingInterval: {
      type: String,
      enum: Object.values(BILLING_INTERVALS),
      default: BILLING_INTERVALS.MONTHLY,
    },
    nextBillingDate: {
      type: Date,
      default: null,
    },
    paymentTerms: {
      type: String,
      enum: Object.values(PAYMENT_TERMS),
      default: PAYMENT_TERMS.IMMEDIATE,
    },
    lines: [subscriptionLineSchema],
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
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.CONFIRMED,
      index: true,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closureReason: {
      type: String,
      trim: true,
      default: "",
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

subscriptionSchema.index({ subscriptionNumber: "text" });

subscriptionSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    subscriptionNumber: this.subscriptionNumber,
    customerId: this.customerId,
    planId: this.planId,
    quotationId: this.quotationId,
    planSnapshot: this.planSnapshot,
    startDate: this.startDate,
    expiryDate: this.expiryDate,
    billingInterval: this.billingInterval,
    nextBillingDate: this.nextBillingDate,
    paymentTerms: this.paymentTerms,
    lines: this.lines || [],
    subtotal: this.subtotal,
    taxTotal: this.taxTotal,
    discountId: this.discountId,
    discountSnapshot: this.discountSnapshot,
    discountTotal: this.discountTotal,
    grandTotal: this.grandTotal,
    status: this.status,
    pausedAt: this.pausedAt,
    closedAt: this.closedAt,
    closureReason: this.closureReason,
    createdBy: this.createdBy,
    statusHistory: this.statusHistory || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
