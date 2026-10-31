import * as quotationTemplateService from "../services/quotationTemplate.service.js";

export const createQuotationTemplate = async (req, res) => {
  try {
    const template = await quotationTemplateService.createQuotationTemplate({
      ...req.body,
      createdBy: req.user._id || req.user.id,
    });
    return res.status(201).json({
      success: true,
      message: "Quotation template created successfully",
      template,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create quotation template",
    });
  }
};

export const listQuotationTemplates = async (req, res) => {
  try {
    const { page, limit, search, isActive, planId } = req.query;
    const result = await quotationTemplateService.listQuotationTemplates({
      page,
      limit,
      search,
      isActive,
      planId,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list quotation templates",
    });
  }
};

export const getQuotationTemplate = async (req, res) => {
  try {
    const template = await quotationTemplateService.getQuotationTemplateById(req.params.id);
    return res.status(200).json({
      success: true,
      template,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve quotation template",
    });
  }
};

export const updateQuotationTemplate = async (req, res) => {
  try {
    const template = await quotationTemplateService.updateQuotationTemplate(
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Quotation template updated successfully",
      template,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update quotation template",
    });
  }
};
