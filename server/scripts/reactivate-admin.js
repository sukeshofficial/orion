import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../src/config/db.js";
import User, { USER_STATUS } from "../src/models/user.model.js";
import { USER_ROLES } from "../src/config/roles.js";

const reenableAdmins = async () => {
  try {
    await connectDB();
    const adminEmail = (process.env.ADMIN_EMAIL || "sukesh.official.2006@gmail.com").toLowerCase().trim();

    // 1. Enable the configured ADMIN_EMAIL user
    const res = await User.updateMany(
      {
        $or: [
          { email: adminEmail },
          { role: { $in: [USER_ROLES.ADMIN, "admin"] } }
        ]
      },
      {
        $set: {
          status: USER_STATUS.ACTIVE,
          role: USER_ROLES.ADMIN,
          permissions: ["*"]
        }
      }
    );

    console.log(`Successfully reactivated admin accounts (matched: ${res.matchedCount}, modified: ${res.modifiedCount})`);

    const users = await User.find({ email: adminEmail });
    console.log("Current user records with admin email:", users.map(u => ({ email: u.email, role: u.role, status: u.status })));
  } catch (err) {
    console.error("Error reenabling admin:", err);
  } finally {
    await mongoose.disconnect();
  }
};

reenableAdmins();
