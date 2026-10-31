import * as customerService from "../services/customer.service.js";

/**
 * Customer Controller
 * Provides customer profile management endpoints.
 */

export const createCustomer = async (req, res) => {
  try {
    const {
      userId,
      companyName,
      phone,
      billingAddress,
      taxIdentificationNumber,
      customerNumber,
    } = req.body;

    const customer = await customerService.createCustomer({
      userId,
      companyName,
      phone,
      billingAddress,
      taxIdentificationNumber,
      customerNumber,
    });

    return res.status(201).json({
      success: true,
      message: "Customer profile created successfully",
      customer,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create customer profile",
    });
  }
};

export const listCustomers = async (req, res) => {
  try {
    const { page, limit, search, isActive, status } = req.query;
    const result = await customerService.listCustomers({
      page,
      limit,
      search,
      isActive,
      status,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list customers",
    });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve customer",
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Customer profile updated successfully",
      customer,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update customer profile",
    });
  }
};
