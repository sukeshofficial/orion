// src/services/authService.js
import api from "@/api/api";

const AUTH_BASE_URL = "/api/v1/auth";
const TOKEN_STORAGE_KEY = "auth_token";

/**
 * Token management helpers
 */
export function getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
}

export function setStoredToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

export function removeStoredToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Helper to build auth headers with Bearer token
 * Uses explicit token if provided, falls back to token from localStorage
 */
function buildAuthHeaders(token, customHeaders = {}) {
    const activeToken = token || getStoredToken();
    const headers = { ...customHeaders };
    if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
    }
    return headers;
}

/**
 * 1. Register customer account
 * POST /api/v1/auth/register
 * 
 * Supports object: { name, email, phone, password, confirmPassword }
 * Or legacy signature: signup(email, password, avatarFile)
 * Response: { success, message, user, token }
 */
export async function register(userDataOrEmail, password, _avatarFile) {
    let payload;

    if (typeof userDataOrEmail === "object" && userDataOrEmail !== null) {
        payload = userDataOrEmail;
    } else {
        payload = {
            email: userDataOrEmail,
            password: password,
            confirmPassword: password,
            name: userDataOrEmail ? userDataOrEmail.split("@")[0] : "Customer",
            phone: "+1 555-0000",
        };
    }

    const { data } = await api.post(`${AUTH_BASE_URL}/register`, payload);

    if (data?.token) {
        setStoredToken(data.token);
    }

    return data;
}

// Alias for register to maintain backward compatibility with existing SignupPage
export const signup = register;

/**
 * 2. Authenticate user
 * POST /api/v1/auth/login
 * 
 * Accepts (email, password) or object { email, password }
 * Response: { success, message, user, token }
 */
export async function login(emailOrCredentials, maybePassword) {
    let payload;

    if (typeof emailOrCredentials === "object" && emailOrCredentials !== null) {
        payload = emailOrCredentials;
    } else {
        payload = {
            email: emailOrCredentials,
            password: maybePassword,
        };
    }

    const { data } = await api.post(`${AUTH_BASE_URL}/login`, payload);

    if (data?.token) {
        setStoredToken(data.token);
    }

    return data;
}

/**
 * 3. Get current authenticated user profile
 * GET /api/v1/auth/me
 * 
 * Requires authentication (Bearer token or cookie)
 * Response: { success, user }
 */
export async function getMe(token) {
    const headers = buildAuthHeaders(token);
    const { data } = await api.get(`${AUTH_BASE_URL}/me`, { headers });
    return data;
}

export const getCurrentUser = getMe;
export const getProfile = getMe;

/**
 * 4. Update current user profile
 * PATCH /api/v1/auth/me
 * 
 * Permitted fields: name, phone.
 * Privileged fields (role, status, email, password) are ignored by server.
 * Response: { success, message, user, ignoredFields? }
 */
export async function updateMe(updates, token) {
    const headers = buildAuthHeaders(token);
    const { data } = await api.patch(`${AUTH_BASE_URL}/me`, updates, { headers });
    return data;
}

export const updateProfile = updateMe;

/**
 * 4b. Upload profile picture to Cloudinary
 * POST /api/v1/auth/profilePic (with fallback to /api/v1/auth/profile-pic)
 *
 * Accepts FormData with field "profilePic"
 * Response: { success, message, url, profilePic, user }
 */
export async function uploadProfilePic(file, token) {
    const formData = new FormData();
    formData.append("profilePic", file);

    const headers = buildAuthHeaders(token, {
        "Content-Type": "multipart/form-data",
    });

    try {
        const { data } = await api.post(`${AUTH_BASE_URL}/profilePic`, formData, { headers });
        return data;
    } catch (err) {
        if (err?.response?.status === 404) {
            const { data } = await api.post(`${AUTH_BASE_URL}/profile-pic`, formData, { headers });
            return data;
        }
        throw err;
    }
}

export const uploadProfilePicture = uploadProfilePic;

/**
 * Select active profile picture from history
 * PATCH /api/v1/auth/me/profile-picture/select
 */
export async function selectProfilePicture(url, token) {
    const headers = buildAuthHeaders(token);
    try {
        const { data } = await api.patch(`${AUTH_BASE_URL}/me/profile-picture/select`, { url }, { headers });
        return data;
    } catch (err) {
        if (err?.response?.status === 404) {
            const { data } = await api.patch(`${AUTH_BASE_URL}/profilePic/select`, { url }, { headers });
            return data;
        }
        throw err;
    }
}

export const selectProfilePic = selectProfilePicture;

/**
 * Delete profile picture (clears active or deletes specific URL from history)
 * DELETE /api/v1/auth/me/profile-picture
 */
export async function deleteProfilePicture(url, token) {
    const headers = buildAuthHeaders(token);
    const config = { headers, params: url ? { url } : {} };
    try {
        const { data } = await api.delete(`${AUTH_BASE_URL}/me/profile-picture`, config);
        return data;
    } catch (err) {
        if (err?.response?.status === 404) {
            const { data } = await api.delete(`${AUTH_BASE_URL}/profilePic`, config);
            return data;
        }
        throw err;
    }
}

export const deleteProfilePic = deleteProfilePicture;

/**
 * 5. Access staff dashboard
 * GET /api/v1/auth/staff/dashboard
 * 
 * Requires internal_staff role
 * Response: { success, message, data: { staffMember, staffEmail, role, activeRentalsCount } }
 */
export async function getStaffDashboard(token) {
    const headers = buildAuthHeaders(token);
    const { data } = await api.get(`${AUTH_BASE_URL}/staff/dashboard`, { headers });
    return data;
}

/**
 * 6. Access customer-owned resource
 * GET /api/v1/auth/customer-resource/{customerId}
 * 
 * Requires resource ownership or internal_staff role
 * Response: { success, message, data: { resourceOwnerId, content } }
 */
export async function getCustomerResource(customerId, token) {
    const headers = buildAuthHeaders(token);
    const { data } = await api.get(`${AUTH_BASE_URL}/customer-resource/${customerId}`, { headers });
    return data;
}

/**
 * Request email verification link
 * POST /api/v1/auth/email-verification/request
 */
export async function requestEmailVerification(token) {
    const headers = buildAuthHeaders(token);
    const { data } = await api.post(`${AUTH_BASE_URL}/email-verification/request`, {}, { headers });
    return data;
}

/**
 * Confirm email verification with token
 * POST /api/v1/auth/email-verification/confirm
 */
export async function confirmEmailVerification(verificationToken) {
    const { data } = await api.post(`${AUTH_BASE_URL}/email-verification/confirm`, { token: verificationToken });
    return data;
}

/**
 * 7. Request password recovery link
 * POST /api/v1/auth/forgot-password
 * 
 * Accepts email string or object { email }
 * Response: { success, message }
 */
export async function forgotPassword(emailOrPayload) {
    const payload =
        typeof emailOrPayload === "object" && emailOrPayload !== null
            ? emailOrPayload
            : { email: emailOrPayload };

    const { data } = await api.post(`${AUTH_BASE_URL}/forgot-password`, payload);
    return data;
}

/**
 * 8. Reset password with token
 * POST /api/v1/auth/reset-password
 * 
 * Supports:
 * - resetPassword(token, newPassword)
 * - resetPassword({ token, newPassword })
 * - legacy signature: resetPassword(email, token, newPassword)
 * Response: { success, message }
 */
export async function resetPassword(arg1, arg2, arg3) {
    let payload;

    if (typeof arg1 === "object" && arg1 !== null) {
        payload = {
            token: arg1.token || arg1.reset_token,
            newPassword: arg1.newPassword,
        };
    } else if (arg3 !== undefined) {
        // legacy: (email, token, newPassword)
        payload = {
            token: arg2,
            newPassword: arg3,
        };
    } else {
        // standard: (token, newPassword)
        payload = {
            token: arg1,
            newPassword: arg2,
        };
    }

    const { data } = await api.post(`${AUTH_BASE_URL}/reset-password`, payload);
    return data;
}

/**
 * 8b. Verify reset token validity
 * GET /api/v1/auth/verify-reset-token?token=...
 */
export async function verifyResetToken(token) {
    const { data } = await api.get(`${AUTH_BASE_URL}/verify-reset-token`, {
        params: { token },
    });
    return data;
}

/**
 * 9. Logout
 * POST /api/v1/auth/logout
 * 
 * Response: { success, message }
 */
export async function logout(token) {
    const headers = buildAuthHeaders(token);
    try {
        const { data } = await api.post(`${AUTH_BASE_URL}/logout`, {}, { headers });
        return data;
    } finally {
        removeStoredToken();
    }
}

/**
 * Ancillary / UI utility endpoints
 */


/**
 * Profile preview
 */
export async function getUserPreview(email) {
    const { data } = await api.get("/api/auth/user-preview", {
        params: { email },
    });
    return data;
}