import * as subscriptionService from "../services/subscription.service.js";

export const convertQuotation = async (req, res) => {
  try {
    const subscription = await subscriptionService.convertQuotationToSubscription(
      req.params.id,
      req.user
    );
    return res.status(201).json({
      success: true,
      message: "Quotation converted to subscription successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to convert quotation",
    });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.createSubscription({
      ...req.body,
      createdBy: req.user._id || req.user.id,
    });
    return res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create subscription",
    });
  }
};

export const listSubscriptions = async (req, res) => {
  try {
    const { page, limit, search, status, customerId, planId } = req.query;
    const result = await subscriptionService.listSubscriptions(req.user, {
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
      message: error.message || "Failed to list subscriptions",
    });
  }
};

export const getSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(
      req.params.id,
      req.user
    );
    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve subscription",
    });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.updateSubscription(
      req.params.id,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update subscription",
    });
  }
};

export const confirmSubscription = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const subscription = await subscriptionService.confirmSubscription(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Subscription confirmed successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to confirm subscription",
    });
  }
};

export const activateSubscription = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const subscription = await subscriptionService.activateSubscription(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to activate subscription",
    });
  }
};

export const pauseSubscription = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const subscription = await subscriptionService.pauseSubscription(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Subscription paused successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to pause subscription",
    });
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const subscription = await subscriptionService.resumeSubscription(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Subscription resumed successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to resume subscription",
    });
  }
};

export const renewSubscription = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const subscription = await subscriptionService.renewSubscription(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Subscription renewed successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to renew subscription",
    });
  }
};

export const closeSubscription = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const subscription = await subscriptionService.closeSubscription(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Subscription closed successfully",
      subscription,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to close subscription",
    });
  }
};
