import * as planService from "../services/plan.service.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";

export const createPlan = async (req, res) => {
  try {
    const plan = await planService.createPlan({
      ...req.body,
      userId: req.user._id,
    });
    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create plan",
    });
  }
};

export const listPlans = async (req, res) => {
  try {
    const { page, limit, search, billingInterval, isActive } = req.query;
    const userRole = normalizeRole(req.user.role);

    // If customer role, only return active available plans
    let activeFilter = isActive;
    let checkAvailability = false;
    if (userRole === USER_ROLES.USER) {
      activeFilter = true;
      checkAvailability = true;
    }

    const result = await planService.listPlans({
      page,
      limit,
      search,
      billingInterval,
      isActive: activeFilter,
      checkAvailability,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list plans",
    });
  }
};

export const getPlan = async (req, res) => {
  try {
    const plan = await planService.getPlanById(req.params.id);
    const userRole = normalizeRole(req.user.role);

    // If customer role and plan is inactive, deny access
    if (userRole === USER_ROLES.USER && !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve plan",
    });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update plan",
    });
  }
};

export const updatePlanStatus = async (req, res) => {
  try {
    const { isActive, status } = req.body;
    const activeValue = typeof isActive !== "undefined" ? isActive : status;
    const plan = await planService.updatePlanStatus(req.params.id, activeValue);
    return res.status(200).json({
      success: true,
      message: "Plan status updated successfully",
      plan,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update plan status",
    });
  }
};
