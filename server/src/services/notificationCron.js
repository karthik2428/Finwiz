// src/services/notificationCron.js
import cron from "node-cron";
import User from "../models/User.js";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import Subscription from "../models/Subscription.js";
import Goal from "../models/Goal.js";
import { notifyUser } from "./notificationService.js";
import moment from "moment";

let job = null;

export function startNotificationCron(cronSpec = "0 */6 * * *") {
  // default: every 6 hours
  if (job) return;

  job = cron.schedule(cronSpec, async () => {
    console.log("[NotificationCron] Started");

    const users = await User.find({});

    for (const user of users) {
      try {
        await handleBudgetAlerts(user);
        await handleSubscriptionAlerts(user);
        await handleGoalAlerts(user);
      } catch (err) {
        console.error("Notification error for user", user._id, err.message);
      }
    }

    console.log("[NotificationCron] Finished");
  });

  job.start();
}

export function stopNotificationCron() {
  if (!job) return;
  job.stop();
  job.destroy();
  job = null;
}

/**
 * BUDGET ALERTS: 80% / 100% notifications
 */
async function handleBudgetAlerts(user) {
  const monthKey = moment().format("YYYY-MM");

  const budgets = await Budget.find({ createdBy: user._id, month: monthKey });
  for (const b of budgets) {
    const start = moment(monthKey).startOf("month").toDate();
    const end = moment(monthKey).endOf("month").toDate();

    const agg = await Transaction.aggregate([
      { $match: { createdBy: user._id, category: b.category, kind: "expense", date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const spent = agg[0]?.total || 0;
    const pct = (spent / b.limitAmount) * 100;

    if (pct >= 100) {
      await notifyUser(user, {
        title: `Budget Limit Crossed: ${b.category}`,
        message: `You have exceeded the budget for ${b.category}. Spent ₹${spent}.`,
        type: "budget",
      });
    } else if (pct >= 80) {
      await notifyUser(user, {
        title: `Budget Alert: ${b.category}`,
        message: `You reached 80% of your budget for ${b.category}. Spent ₹${spent}.`,
        type: "budget",
      });
    }
  }
}

/**
 * SUBSCRIPTION ALERTS: renewal in next 3 days + price creep
 */
async function handleSubscriptionAlerts(user) {
  const subs = await Subscription.find({ user: user._id, active: true });

  for (const s of subs) {
    if (!s.estimatedNextDate) continue;

    const daysLeft = moment(s.estimatedNextDate).diff(moment(), "days");

    if (daysLeft >= 0 && daysLeft <= 3) {
      await notifyUser(user, {
        title: `Upcoming Subscription Renewal`,
        message: `${s.title} renews in ${daysLeft} day(s). Estimated monthly cost: ₹${Math.round(s.monthlyCost)}.`,
        type: "subscription"
      });
    }

    // price creep alerts for premium users
    if (user.role === "premium" && s.priceCreep) {
      await notifyUser(user, {
        title: `Price Creep Detected`,
        message: `${s.title} shows increasing charges recently. Review your subscription.`,
        type: "subscription"
      });
    }
  }
}

/**
 * GOAL DEADLINE ALERTS
 */
async function handleGoalAlerts(user) {
  const goals = await Goal.find({ createdBy: user._id });

  for (const g of goals) {
    const daysLeft = moment(g.targetDate).diff(moment(), "days");
    if (daysLeft === 7) {
      await notifyUser(user, {
        title: `Goal Approaching: ${g.title}`,
        message: `Your goal "${g.title}" is due in 7 days. Stay focused!`,
        type: "goal"
      });
    }
  }
}
