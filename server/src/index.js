// src/index.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import transactionsRoutes from "./routes/transactionsRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import { startSubscriptionScanner } from "./services/cronService.js";
import goalRoutes from "./routes/goalRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import forecastRoutes from "./routes/forecastRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import adminNewsRoutes from "./routes/adminNewsRoutes.js";
import { startNewsCron } from "./services/newsCron.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startNotificationCron } from "./services/notificationCron.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";
import { startPaymentCron } from "./services/paymentCron.js";
import reportRoutes from "./routes/reportRoutes.js";
import { startReportCron } from "./services/reportCron.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminFundRoutes from "./routes/adminFundRoutes.js";
import adminSystemRoutes from "./routes/adminSystemRoutes.js";
import adminConfigRoutes from "./routes/adminConfigRoutes.js";
import adminLogRoutes from "./routes/adminLogRoutes.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorLogger } from "./middlewares/errorLogger.js";
import { startLogCron } from "./services/logCron.js";
dotenv.config();
const app = express();

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Dynamic check for localhost
    if (/^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// start cron scanner (only in non-test env)
if (process.env.NODE_ENV !== "test") {
  try {
    startNewsCron(process.env.NEWS_CRON); // env optional
  } catch (err) {
    console.error("Failed to start news cron:", err);
  }
}

if (process.env.NODE_ENV !== "test") {
  try {
    startSubscriptionScanner(process.env.SUBSCRIPTION_SCAN_CRON || "0 2 * * *");
  } catch (err) {
    console.error("Failed to start subscription scanner:", err);
  }
}

if (process.env.NODE_ENV !== "test") {
  startNotificationCron(process.env.NOTIFICATION_CRON || "0 */6 * * *");
}

if (process.env.NODE_ENV !== "test") startPaymentCron();

if (process.env.NODE_ENV !== "test") {
  try {
    startReportCron(process.env.REPORT_CRON);
  } catch (err) {
    console.error("Failed to start report cron:", err);
  }
}

if (process.env.NODE_ENV !== "test") startLogCron();

console.log("Loaded CLIENT_URL:", process.env.CLIENT_URL);

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is working!' });
});


app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/transactions", transactionsRoutes);
app.use("/budget", budgetRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/goals", goalRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/forecast", forecastRoutes);
app.use("/recommendations", recommendationRoutes);
app.use("/news", newsRoutes);
app.use("/admin/news", adminNewsRoutes);
app.use("/notifications", notificationRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin/payments", adminPaymentRoutes);
app.use("/report", reportRoutes);
app.use("/admin/users", adminUserRoutes);
app.use("/admin/funds", adminFundRoutes);
app.use("/admin/system", adminSystemRoutes);
app.use("/admin/config", adminConfigRoutes);
app.use("/admin/logs", adminLogRoutes);
app.use(errorLogger);


// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
