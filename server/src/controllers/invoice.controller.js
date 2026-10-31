import * as invoiceService from "../services/invoice.service.js";

export const generateInvoice = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "subscriptionId is required",
      });
    }

    const result = await invoiceService.generateInvoiceForSubscription(
      subscriptionId,
      {
        userId: req.user._id || req.user.id,
      }
    );

    const statusCode = result.isNew ? 201 : 200;
    return res.status(statusCode).json({
      success: true,
      message: result.message,
      invoice: result.invoice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to generate invoice",
    });
  }
};

export const listInvoices = async (req, res) => {
  try {
    const { page, limit, status, customerId, subscriptionId, search } = req.query;
    const result = await invoiceService.listInvoices(req.user, {
      page,
      limit,
      status,
      customerId,
      subscriptionId,
      search,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list invoices",
    });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve invoice",
    });
  }
};

export const confirmInvoice = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const invoice = await invoiceService.confirmInvoice(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Invoice confirmed successfully",
      invoice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to confirm invoice",
    });
  }
};

export const cancelInvoice = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const invoice = await invoiceService.cancelInvoice(
      req.params.id,
      req.user,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Invoice cancelled successfully",
      invoice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to cancel invoice",
    });
  }
};

export const sendInvoice = async (req, res) => {
  try {
    const { recipient } = req.body || {};
    const result = await invoiceService.sendInvoice(
      req.params.id,
      req.user,
      recipient
    );
    return res.status(200).json({
      success: true,
      message: "Invoice sent successfully",
      invoice: result.invoice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send invoice",
    });
  }
};

export const getInvoicePdf = async (req, res) => {
  try {
    const { buffer, filename } = await invoiceService.generateInvoicePdfBuffer(
      req.params.id,
      req.user
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to generate invoice PDF",
    });
  }
};
