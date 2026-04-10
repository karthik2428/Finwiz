import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      await axios.post("/auth/forgot-password", { email });

      navigate("/verify-otp", { state: { email } });

    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-w-md">

        <h2 className="text-2xl font-bold text-white mb-6">
          Forgot Password
        </h2>

        {message && (
          <div className="mb-4 text-red-300">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
          />

          <button
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            Send OTP
          </button>

        </form>
      </div>

    </div>
  );
}