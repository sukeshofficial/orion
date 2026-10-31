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
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        ret._id = ret.id;
        if (ret.userId && typeof ret.userId === "object") {
          ret.name = ret.userId.name || ret.companyName || "Customer";
          ret.email = ret.userId.email || "";
          ret.phone = ret.phone || ret.userId.phone || "";
        } else {
          ret.name = ret.companyName || "Customer";
        }
        ret.company = ret.companyName || "";
        ret.taxId = ret.taxIdentificationNumber || "";
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

  const id = this._id ? this._id.toString() : this.id;
  const name =
    (userSafe && typeof userSafe === "object" && userSafe.name) ||
    this.companyName ||
    "Customer";
  const email =
    (userSafe && typeof userSafe === "object" && userSafe.email) || "";
  const phone =
    this.phone ||
    (userSafe && typeof userSafe === "object" && userSafe.phone) ||
    "";

  return {
    id,
    _id: id,
    userId: userSafe,
    name,
    email,
    phone,
    company: this.companyName || "",
    companyName: this.companyName || "",
    billingAddress: this.billingAddress || {},
    taxIdentificationNumber: this.taxIdentificationNumber || "",
    taxId: this.taxIdentificationNumber || "",
    customerNumber: this.customerNumber,
    isActive: this.isActive !== false,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
