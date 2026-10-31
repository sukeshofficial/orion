import * as analyticsService from "../services/analytics.service.js";

export const getOverview = async (req, res) => {
  try {
    const data = await analyticsService.getOverviewAnalytics(req.query);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve overview analytics",
    });
  }
};

export const getRevenue = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const data = await analyticsService.getRevenueAnalytics({
      startDate,
      endDate,
      groupBy,
    });
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve revenue analytics",
    });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    const data = await analyticsService.getSubscriptionAnalytics();
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve subscription analytics",
    });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getInvoiceAnalytics({
      startDate,
      endDate,
    });
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve invoice analytics",
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const data = await analyticsService.getPaymentAnalytics({
      startDate,
      endDate,
      groupBy,
    });
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve payment analytics",
    });
  }
};
