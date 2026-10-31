/**
 * Storage Service Abstraction
 * Supports Cloudinary storage when configured, with a provider-independent fallback.
 * Uses HTTP APIs without external SDK dependencies.
 */

import crypto from "node:crypto";

/**
 * Validates uploaded image format and size.
 * @param {object} file - { buffer, mimetype, size, originalname } or base64 data URL
 * @param {number} maxSizeBytes - Default 5MB
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateImageFile = (file, maxSizeBytes = 5 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: "No image file provided" };
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (file.mimetype && !allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format: ${file.mimetype}. Allowed formats: JPG, PNG, WEBP, GIF`,
    };
  }

  if (file.size && file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${maxSizeBytes / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
};

/**
 * Checks if Cloudinary is configured via environment variables.
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Uploads an image to Cloudinary using its REST API directly (no heavy SDK needed).
 * Falls back to an inline Base64 data URI if Cloudinary is not configured.
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - MIME type (e.g., 'image/png')
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{ url: string, publicId?: string }>}
 */
export const uploadImage = async (buffer, mimetype = "image/jpeg", folder = "avatars") => {
  const base64Data = `data:${mimetype};base64,${buffer.toString("base64")}`;

  if (!isCloudinaryConfigured()) {
    // Return base64 data URI when Cloudinary is not configured (e.g. in development/tests)
    return {
      url: base64Data,
      publicId: null,
      provider: "base64",
    };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new URLSearchParams();
  formData.append("file", base64Data);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || "Failed to upload image to Cloudinary";
    throw new Error(errorMsg);
  }

  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    provider: "cloudinary",
  };
};

/**
 * Deletes an image from storage if publicId is provided.
 * @param {string} publicId
 */
export const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) {
    return { success: true };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new URLSearchParams();
  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json();
  return data;
};
