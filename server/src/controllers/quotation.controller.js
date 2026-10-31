import * as quotationService from "../services/quotation.service.js";

export const createQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.createQuotation({
      ...req.body,
      createdBy: req.user._id || req.user.id,
    });
    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create quotation",
    });
  }
};

export const listQuotations = async (req, res) => {
  try {
    const { page, limit, search, status, customerId, planId } = req.query;
    const result = await quotationService.listQuotations(req.user, {
      page,
      limit,
      search,
      status,
      customerId,
      planId,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list quotations",
    });
  }
};

export const getQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      quotation,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve quotation",
    });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const quotation = await quotationService.updateQuotation(
      req.params.id,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      quotation,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update quotation",
    });
  }
};

export const confirmQuotation = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const quotation = await quotationService.confirmQuotation(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Quotation confirmed successfully",
      quotation,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to confirm quotation",
    });
  }
};

export const cancelQuotation = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const quotation = await quotationService.cancelQuotation(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Quotation cancelled successfully",
      quotation,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to cancel quotation",
    });
  }
};
