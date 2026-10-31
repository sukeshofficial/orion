import * as paymentService from "../services/payment.service.js";

export const createPayment = async (req, res) => {
  try {
    const idempotencyKey = req.headers["idempotency-key"] || req.body?.idempotencyKey;
    const { invoiceId, amount, paymentMethod, reference, notes } = req.body || {};

    const result = await paymentService.recordPayment({
      invoiceId,
      amount,
      paymentMethod,
      reference,
      notes,
      idempotencyKey,
      authenticatedUser: req.user,
    });

    const statusCode = result.isDuplicate ? 200 : 201;
    return res.status(statusCode).json({
      success: true,
      message: result.message,
      payment: result.payment,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to record payment",
    });
  }
};

export const listPayments = async (req, res) => {
  try {
    const { page, limit, invoiceId, customerId, status, search } = req.query;
    const result = await paymentService.listPayments(req.user, {
      page,
      limit,
      invoiceId,
      customerId,
      status,
      search,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list payments",
    });
  }
};

export const getPayment = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve payment",
    });
  }
};

export const listPaymentsForInvoice = async (req, res) => {
  try {
    const payments = await paymentService.listPaymentsForInvoice(
      req.params.id,
      req.user
    );
    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to list payments for invoice",
    });
  }
};
