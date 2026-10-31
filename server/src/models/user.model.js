import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../config/roles.js";

// Re-export USER_ROLES for backward compatibility with imports from user.model.js
export { USER_ROLES };

// Keep legacy role aliases for schemas and backward compatibility
export const EXTENDED_ROLES = [
  ...Object.values(USER_ROLES),
  "customer",
  "end_user",
  "internal_staff",
];

export const USER_STATUS = {
  ACTIVE: "active",
  DISABLED: "disabled",
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[0-9+\s\-().]{7,20}$/,
        "Please provide a valid phone number",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: EXTENDED_ROLES,
        message: "{VALUE} is not a supported role",
      },
      default: USER_ROLES.USER,
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    profilePictures: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(USER_STATUS),
        message: "{VALUE} is not a supported status",
      },
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    emailVerificationSentAt: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        // Provide alias profilePic for client compatibility
        ret.profilePic = ret.profilePicture || "";
        ret.profilePictures = ret.profilePictures || [];
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.emailVerificationSentAt;
        return ret;
      },
    },
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe client representation helper
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id ? this._id.toString() : this.id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    permissions: this.permissions || [],
    profilePicture: this.profilePicture || "",
    profilePic: this.profilePicture || "", // Alias for client compatibility
    profilePictures: this.profilePictures || [],
    status: this.status,
    emailVerified: this.emailVerified,
    tokenVersion: this.tokenVersion ?? 0,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
