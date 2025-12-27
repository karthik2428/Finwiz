// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const RiskAnswersSchema = new mongoose.Schema({
  // Example questions — editable
  investment_experience: { type: String, enum: ["none", "low", "medium", "high"], default: "none" },
  emergency_buffer_months: { type: Number, default: 3 },
  time_horizon_preference: { type: String, enum: ["short", "medium", "long"], default: "medium" },
  liquidity_need: { type: String, enum: ["low", "medium", "high"], default: "medium" },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  age: { type: Number, required: true, min: 10, max: 120 },
  role: { type: String, enum: ["free", "premium", "admin"], default: "free" },
  riskAnswers: { type: RiskAnswersSchema, default: () => ({}) },
  premium: {
    isActive: { type: Boolean, default: false },
    startDate: { type: Date },
    expiryDate: { type: Date },
    plan: { type: String, enum: ["monthly", "yearly", "admin"], default: "monthly" }
  },

  createdAt: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Hash password pre-save
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// Compare password method
UserSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Virtual for isPremium
UserSchema.virtual("isPremium").get(function () {
  return (
    this.role === "admin" ||
    (this.premium &&
      this.premium.expiryDate &&
      new Date() < new Date(this.premium.expiryDate))
  );
});

const User = mongoose.model("User", UserSchema);
export default User;
