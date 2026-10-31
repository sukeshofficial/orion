import * as taxService from "../services/tax.service.js";

export const createTax = async (req, res) => {
  try {
    const { name, rate, description, isDefault } = req.body;
    const tax = await taxService.createTax({
      name,
      rate,
      description,
      isDefault,
      userId: req.user._id,
    });
    return res.status(201).json({
      success: true,
      message: "Tax configuration created successfully",
      tax,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create tax",
    });
  }
};

export const listTaxes = async (req, res) => {
  try {
    const { page, limit, isActive, search } = req.query;
    const result = await taxService.listTaxes({
      page,
      limit,
      isActive,
      search,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list taxes",
    });
  }
};

export const getTax = async (req, res) => {
  try {
    const tax = await taxService.getTaxById(req.params.id);
    return res.status(200).json({
      success: true,
      tax,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve tax",
    });
  }
};

export const updateTax = async (req, res) => {
  try {
    const tax = await taxService.updateTax(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Tax configuration updated successfully",
      tax,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update tax",
    });
  }
};

export const updateTaxStatus = async (req, res) => {
  try {
    const { isActive, status } = req.body;
    const activeValue = typeof isActive !== "undefined" ? isActive : status;
    const tax = await taxService.updateTaxStatus(req.params.id, activeValue);
    return res.status(200).json({
      success: true,
      message: "Tax status updated successfully",
      tax,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update tax status",
    });
  }
};
