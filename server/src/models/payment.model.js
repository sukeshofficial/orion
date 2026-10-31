import mongoose from "mongoose";

export const PAYMENT_METHODS = {
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  BANK_TRANSFER: "bank_transfer",
  UPI: "upi",
  CASH: "cash",
  OTHER: "other",
};

export const PAYMENT_STATUS = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: [true, "paymentNumber is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "invoiceId is required"],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "customerId is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [1, "Payment amount must be greater than 0"],
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.CREDIT_CARD,
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.COMPLETED,
      index: true,
    },
    reference: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
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

paymentSchema.index({ paymentNumber: "text", reference: "text" });

paymentSchema.virtual("paymentReference").get(function () {
  return this.reference || this.paymentNumber;
});

paymentSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    paymentNumber: this.paymentNumber,
    paymentReference: this.reference || this.paymentNumber,
    invoiceId: this.invoiceId,
    customerId: this.customerId,
    amount: this.amount,
    paymentMethod: this.paymentMethod,
    paymentDate: this.paymentDate,
    status: this.status,
    reference: this.reference,
    notes: this.notes,
    idempotencyKey: this.idempotencyKey,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
