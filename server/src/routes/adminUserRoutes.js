import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  listUsers,
  blockUser,
  unblockUser,
  activatePremium,
  deactivatePremium,
  getUserPayments
} from "../controllers/adminUserController.js";

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};

const router = express.Router();
router.use(protect, adminOnly);

router.get("/", listUsers);
router.put("/:id/block", blockUser);
router.put("/:id/unblock", unblockUser);
router.put("/:id/premium-activate", activatePremium);
router.put("/:id/premium-deactivate", deactivatePremium);
router.get("/:id/payments", getUserPayments);

export default router;
