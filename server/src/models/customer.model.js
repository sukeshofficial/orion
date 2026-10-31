import mongoose from "mongoose";

/**
 * Customer Profile Schema
 * Associates business/customer metadata with an existing User account.
 */
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,
      index: true,
    },
    customerNumber: {
      type: String,
      required: [true, "customerNumber is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    billingAddress: {
      type: addressSchema,
      default: () => ({}),
    },
    taxIdentificationNumber: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Compound text/index search support
customerSchema.index({ companyName: "text", customerNumber: "text" });

/**
 * Helper to safely sanitize a customer document with populated user.
 */
customerSchema.methods.toSafeObject = function () {
  const userSafe =
    this.userId && typeof this.userId.toSafeObject === "function"
      ? this.userId.toSafeObject()
      : this.userId;

  return {
    id: this._id ? this._id.toString() : this.id,
    userId: userSafe,
    customerNumber: this.customerNumber,
    companyName: this.companyName || "",
    phone: this.phone || "",
    billingAddress: this.billingAddress || {},
    taxIdentificationNumber: this.taxIdentificationNumber || "",
    isActive: this.isActive !== false,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
