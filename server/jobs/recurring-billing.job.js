import Subscription, {
  SUBSCRIPTION_STATUS,
} from "../src/models/subscription.model.js";
import { generateInvoiceForSubscription } from "../src/services/invoice.service.js";

/**
 * Recurring Billing Job
 * Discovers active subscriptions whose nextBillingDate is due (or past due),
 * and safely creates recurring invoices idempotently.
 *
 * Configurable timezone & error recovery.
 */
export const runRecurringBillingJob = async ({
  asOfDate = new Date(),
  timezone = "UTC",
  batchSize = 50,
} = {}) => {
  const startTime = new Date();
  const targetDate = new Date(asOfDate);

  const stats = {
    totalEvaluated: 0,
    invoicesCreated: 0,
    invoicesSkipped: 0,
    errors: [],
    startTime,
    endTime: null,
    timezone,
  };

  try {
    // 1. Find all active subscriptions whose next billing date is due
    const dueSubscriptions = await Subscription.find({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      nextBillingDate: { $lte: targetDate },
    })
      .limit(batchSize)
      .populate("planId");

    stats.totalEvaluated = dueSubscriptions.length;

    for (const sub of dueSubscriptions) {
      try {
        const result = await generateInvoiceForSubscription(sub, {
          asOfDate: targetDate,
          force: false,
        });

        if (result.isNew) {
          stats.invoicesCreated++;
        } else {
          stats.invoicesSkipped++;
        }
      } catch (err) {
        stats.errors.push({
          subscriptionId: sub._id.toString(),
          subscriptionNumber: sub.subscriptionNumber,
          error: err.message,
        });
      }
    }
  } catch (outerErr) {
    stats.errors.push({ global: outerErr.message });
  } finally {
    stats.endTime = new Date();
  }

  return stats;
};

export default runRecurringBillingJob;
