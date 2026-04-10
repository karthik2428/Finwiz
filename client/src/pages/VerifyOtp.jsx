import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../services/api";

export default function VerifyOtp() {

  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");

  const verifyOtp = async (e) => {
    e.preventDefault();

    try {

      await axios.post("/auth/verify-otp", {
        email,
        otp
      });

      navigate("/reset-password", { state: { email } });

    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-w-md">

        <h2 className="text-2xl text-white font-bold mb-6">
          Verify OTP
        </h2>

        <form onSubmit={verifyOtp} className="space-y-5">

          <input
            type="text"
            placeholder="Enter OTP"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
          />

          <button className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600">
            Verify OTP
          </button>

        </form>
      </div>

    </div>
  );
}