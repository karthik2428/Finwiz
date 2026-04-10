import express from "express";
import { protect } from "../middlewares/auth.js";
import { listFunds, syncFundsFromMFAPI, updateFund } from "../controllers/adminFundController.js";

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};

const router = express.Router();
router.use(protect, adminOnly);

router.get("/", listFunds);
router.put("/:schemeCode", updateFund);
router.post("/sync", protect, syncFundsFromMFAPI);

export default router;
