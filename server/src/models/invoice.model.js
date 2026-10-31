import mongoose from "mongoose";

export const INVOICE_STATUS = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
  CANCELLED: "Cancelled",
  OVERDUE: "Overdue",
};

const invoiceLineSchema = new mongoose.Schema(
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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "invoiceNumber is required"],
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
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
    },
    billingPeriodStart: {
      type: Date,
      default: null,
      index: true,
    },
    billingPeriodEnd: {
      type: Date,
      default: null,
      index: true,
    },
    issueDate: {
      type: Date,
      required: [true, "issueDate is required"],
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, "dueDate is required"],
      index: true,
    },
    lines: [invoiceLineSchema],
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
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    // amountDue / outstandingAmount = totalAmount - amountPaid
    amountDue: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.CONFIRMED,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    sentAt: {
      type: Date,
      default: null,
    },
    sentTo: {
      type: String,
      trim: true,
      default: "",
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

invoiceSchema.index({ invoiceNumber: "text" });

// Compound unique index for duplicate prevention in recurring billing
invoiceSchema.index(
  { subscriptionId: 1, billingPeriodStart: 1, billingPeriodEnd: 1 },
  {
    unique: true,
    partialFilterExpression: {
      subscriptionId: { $type: "objectId" },
      billingPeriodStart: { $type: "date" },
      billingPeriodEnd: { $type: "date" },
    },
  }
);

// Virtuals for spec aliases
invoiceSchema.virtual("invoiceDate").get(function () {
  return this.issueDate;
});

invoiceSchema.virtual("grandTotal").get(function () {
  return this.totalAmount;
});

invoiceSchema.virtual("outstandingAmount").get(function () {
  return this.amountDue;
});

invoiceSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    invoiceNumber: this.invoiceNumber,
    customerId: this.customerId,
    subscriptionId: this.subscriptionId,
    billingPeriodStart: this.billingPeriodStart,
    billingPeriodEnd: this.billingPeriodEnd,
    issueDate: this.issueDate,
    invoiceDate: this.issueDate,
    dueDate: this.dueDate,
    lines: this.lines || [],
    subtotal: this.subtotal,
    taxTotal: this.taxTotal,
    discountId: this.discountId,
    discountSnapshot: this.discountSnapshot,
    discountTotal: this.discountTotal,
    totalAmount: this.totalAmount,
    grandTotal: this.totalAmount,
    amountPaid: this.amountPaid,
    amountDue: this.amountDue,
    outstandingAmount: this.amountDue,
    status: this.status,
    notes: this.notes,
    sentAt: this.sentAt,
    sentTo: this.sentTo,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
