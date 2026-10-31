import { Router } from "express";
import { getProfile, updateProfile, changePassword } from "../controllers/user.controller.js";
import { uploadProfilePicture, deleteProfilePicture } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { parseMultipartImage } from "../middleware/upload.middleware.js";

const router = Router();

// Current user profile endpoints
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.patch("/profile/password", authenticate, changePassword);
router.post("/profile/picture", authenticate, parseMultipartImage("profilePic"), uploadProfilePicture);
router.delete("/profile/picture", authenticate, deleteProfilePicture);

export default router;
