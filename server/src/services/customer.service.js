import Customer from "../models/customer.model.js";
import User, { USER_STATUS } from "../models/user.model.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";

/**
 * Customer Service
 * Handles business customer profiles, auto-generating customer numbers,
 * searching, filtering, and authorization.
 */

/**
 * Generate a unique customer number safely (e.g. CUST-10001 or timestamp-random based).
 */
export const generateCustomerNumber = async () => {
  let unique = false;
  let customerNumber = "";
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    // Get highest existing customer number or generate sequential-style alphanumeric
    const count = await Customer.countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `CUST-${(count + attempts).toString().padStart(4, "0")}-${randomSuffix}`;

    const existing = await Customer.findOne({ customerNumber: candidate });
    if (!existing) {
      customerNumber = candidate;
      unique = true;
    }
  }

  if (!customerNumber) {
    customerNumber = `CUST-${Date.now().toString(36).toUpperCase()}`;
  }

  return customerNumber;
};

/**
 * Create a customer profile linked to a valid User account.
 */
export const createCustomer = async ({
  userId,
  companyName,
  phone,
  billingAddress,
  taxIdentificationNumber,
  customerNumber: customNumber,
}) => {
  if (!userId) {
    const error = new Error("userId is required to associate a customer profile");
    error.statusCode = 400;
    throw error;
  }

  // Validate the associated user exists and is a customer/user
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("Associated user not found");
    error.statusCode = 404;
    throw error;
  }

  // Prevent duplicate customer profiles for the same user
  const existingProfile = await Customer.findOne({ userId });
  if (existingProfile) {
    const error = new Error("A customer profile already exists for this user account");
    error.statusCode = 409;
    throw error;
  }

  // Determine customerNumber
  let finalCustomerNumber = customNumber ? String(customNumber).trim().toUpperCase() : null;
  if (finalCustomerNumber) {
    const duplicateNum = await Customer.findOne({ customerNumber: finalCustomerNumber });
    if (duplicateNum) {
      const error = new Error("A customer with this customer number already exists");
      error.statusCode = 409;
      throw error;
    }
  } else {
    finalCustomerNumber = await generateCustomerNumber();
  }

  const customer = new Customer({
    userId: user._id,
    customerNumber: finalCustomerNumber,
    companyName: companyName ? companyName.trim() : "",
    phone: phone ? phone.trim() : user.phone || "",
    billingAddress: billingAddress || {},
    taxIdentificationNumber: taxIdentificationNumber ? taxIdentificationNumber.trim() : "",
    isActive: true,
  });

  await customer.save();
  await customer.populate("userId");

  return customer.toSafeObject();
};

/**
 * List customers with pagination, search, and active/inactive filtering.
 */
export const listCustomers = async ({
  page = 1,
  limit = 20,
  search,
  isActive,
  status,
}) => {
  // Auto-sync customer profiles for existing customer/user accounts that don't have one
  try {
    const customerUsers = await User.find({
      role: { $in: [USER_ROLES.USER, "customer", "end_user"] },
    }).select("_id name email phone");

    for (const u of customerUsers) {
      const existing = await Customer.findOne({ userId: u._id });
      if (!existing) {
        const custNum = await generateCustomerNumber();
        await Customer.create({
          userId: u._id,
          customerNumber: custNum,
          companyName: u.name || "Customer",
          phone: u.phone || "",
          billingAddress: {},
          taxIdentificationNumber: "",
          isActive: true,
        });
      }
    }
  } catch (syncErr) {
    console.error("Auto customer sync error:", syncErr?.message);
  }

  const query = {};

  if (typeof isActive !== "undefined" && isActive !== null && isActive !== "") {
    query.isActive = isActive === "true" || isActive === true;
  }

  if (status === "active") query.isActive = true;
  if (status === "inactive" || status === "disabled") query.isActive = false;

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

  // If search query is provided, match customer fields or linked user fields
  let matchingUserIds = [];
  if (search) {
    const searchRegex = new RegExp(search, "i");
    const matchedUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select("_id");
    matchingUserIds = matchedUsers.map((u) => u._id);

    query.$or = [
      { customerNumber: searchRegex },
      { companyName: searchRegex },
      { phone: searchRegex },
      { userId: { $in: matchingUserIds } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(query)
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take),
    Customer.countDocuments(query),
  ]);

  return {
    customers: customers.map((c) => c.toSafeObject()),
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Get customer by customer profile ID or by associated user ID.
 */
export const getCustomerById = async (id) => {
  let customer = await Customer.findById(id).populate("userId");
  if (!customer) {
    // Also try looking up by userId for convenience
    customer = await Customer.findOne({ userId: id }).populate("userId");
  }

  if (!customer) {
    const error = new Error("Customer profile not found");
    error.statusCode = 404;
    throw error;
  }

  return customer.toSafeObject();
};

/**
 * Update customer profile fields.
 * Protects authentication-specific fields from being modified here.
 */
export const updateCustomer = async (id, updates = {}) => {
  let customer = await Customer.findById(id);
  if (!customer) {
    customer = await Customer.findOne({ userId: id });
  }

  if (!customer) {
    const error = new Error("Customer profile not found");
    error.statusCode = 404;
    throw error;
  }

  if (typeof updates.companyName === "string") {
    customer.companyName = updates.companyName.trim();
  }

  if (typeof updates.phone === "string") {
    customer.phone = updates.phone.trim();
  }

  if (updates.billingAddress && typeof updates.billingAddress === "object") {
    customer.billingAddress = {
      ...customer.billingAddress,
      ...updates.billingAddress,
    };
  }

  if (typeof updates.taxIdentificationNumber === "string") {
    customer.taxIdentificationNumber = updates.taxIdentificationNumber.trim();
  }

  if (typeof updates.isActive === "boolean") {
    customer.isActive = updates.isActive;
  }

  await customer.save();
  await customer.populate("userId");

  return customer.toSafeObject();
};

/**
 * Get current customer profile for authenticated user.
 * If customer profile doesn't exist yet, lazily initializes a Customer profile.
 */
export const getCustomerMe = async (authenticatedUser) => {
  if (!authenticatedUser) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  const userId = authenticatedUser._id || authenticatedUser.id;
  let customer = await Customer.findOne({ userId }).populate("userId");

  if (!customer) {
    // Lazily create customer profile record for this user if they don't have one yet
    const customerNumber = await generateCustomerNumber();
    customer = new Customer({
      userId,
      customerNumber,
      companyName: "",
      phone: authenticatedUser.phone || "",
      billingAddress: {},
      taxIdentificationNumber: "",
      isActive: true,
    });
    await customer.save();
    await customer.populate("userId");
  }

  return customer.toSafeObject();
};

/**
 * Update current customer profile for authenticated user.
 * Permitted update fields: name, phone, companyName, billingAddress, taxIdentificationNumber.
 * Strips role, permissions, status, email, password, tokenVersion, customerNumber, isActive, etc.
 */
export const updateCustomerMe = async (authenticatedUser, updates = {}) => {
  if (!authenticatedUser) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  const userId = authenticatedUser._id || authenticatedUser.id;
  let customer = await Customer.findOne({ userId });

  if (!customer) {
    const customerNumber = await generateCustomerNumber();
    customer = new Customer({
      userId,
      customerNumber,
      isActive: true,
    });
  }

  // Update User document fields (name, phone) if provided
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User account not found");
    error.statusCode = 404;
    throw error;
  }

  if (typeof updates.name === "string" && updates.name.trim()) {
    user.name = updates.name.trim();
  }

  if (typeof updates.phone === "string") {
    const phoneTrimmed = updates.phone.trim();
    if (phoneTrimmed) {
      const phoneRegex = /^[0-9+\s\-().]{7,20}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        const error = new Error("Please provide a valid phone number");
        error.statusCode = 400;
        throw error;
      }
      user.phone = phoneTrimmed;
      customer.phone = phoneTrimmed;
    }
  }

  // Permitted Customer profile fields
  if (typeof updates.companyName === "string") {
    customer.companyName = updates.companyName.trim();
  }

  if (updates.billingAddress && typeof updates.billingAddress === "object") {
    customer.billingAddress = {
      street: typeof updates.billingAddress.street === "string" ? updates.billingAddress.street.trim() : (customer.billingAddress?.street || ""),
      city: typeof updates.billingAddress.city === "string" ? updates.billingAddress.city.trim() : (customer.billingAddress?.city || ""),
      state: typeof updates.billingAddress.state === "string" ? updates.billingAddress.state.trim() : (customer.billingAddress?.state || ""),
      country: typeof updates.billingAddress.country === "string" ? updates.billingAddress.country.trim() : (customer.billingAddress?.country || ""),
      postalCode: typeof updates.billingAddress.postalCode === "string" ? updates.billingAddress.postalCode.trim() : (customer.billingAddress?.postalCode || ""),
    };
  }

  if (typeof updates.taxIdentificationNumber === "string") {
    customer.taxIdentificationNumber = updates.taxIdentificationNumber.trim();
  }

  // Note: Customers CANNOT update their role, permissions, active status, customerNumber or authentication fields.
  await user.save();
  await customer.save();
  await customer.populate("userId");

  return customer.toSafeObject();
};

