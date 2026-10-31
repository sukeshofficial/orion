import * as productService from "../services/product.service.js";
import { USER_ROLES, normalizeRole } from "../config/roles.js";

export const createProduct = async (req, res) => {
  try {
    const { name, type, salesPrice, costPrice, notes, taxIds, variants, isActive } = req.body;
    const product = await productService.createProduct({
      name,
      type,
      salesPrice,
      costPrice,
      notes,
      taxIds,
      variants,
      isActive,
      userId: req.user._id,
    });
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

export const listProducts = async (req, res) => {
  try {
    const { page, limit, search, type, isActive } = req.query;
    const userRole = normalizeRole(req.user.role);

    // If customer role, only return active products
    let activeFilter = isActive;
    if (userRole === USER_ROLES.USER) {
      activeFilter = true;
    }

    const result = await productService.listProducts({
      page,
      limit,
      search,
      type,
      isActive: activeFilter,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list products",
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    const userRole = normalizeRole(req.user.role);

    // If customer role and product is inactive, deny access
    if (userRole === USER_ROLES.USER && !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve product",
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

export const updateProductStatus = async (req, res) => {
  try {
    const { isActive, status } = req.body;
    const activeValue = typeof isActive !== "undefined" ? isActive : status;
    const product = await productService.updateProductStatus(req.params.id, activeValue);
    return res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      product,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update product status",
    });
  }
};
