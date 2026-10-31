import * as discountService from "../services/discount.service.js";

export const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount({
      ...req.body,
      createdBy: req.user._id || req.user.id,
    });
    return res.status(201).json({
      success: true,
      message: "Discount created successfully",
      discount,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create discount",
    });
  }
};

export const listDiscounts = async (req, res) => {
  try {
    const { page, limit, search, isActive, type, appliesTo } = req.query;
    const result = await discountService.listDiscounts({
      page,
      limit,
      search,
      isActive,
      type,
      appliesTo,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list discounts",
    });
  }
};

export const getDiscount = async (req, res) => {
  try {
    const discount = await discountService.getDiscountById(req.params.id);
    return res.status(200).json({
      success: true,
      discount,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve discount",
    });
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      discount,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update discount",
    });
  }
};

export const updateDiscountStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive (boolean) is required in request body",
      });
    }

    const discount = await discountService.updateDiscountStatus(req.params.id, isActive);
    return res.status(200).json({
      success: true,
      message: "Discount status updated successfully",
      discount,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update discount status",
    });
  }
};
