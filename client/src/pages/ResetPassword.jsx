import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../services/api";

export default function ResetPassword() {

  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      await axios.post("/auth/reset-password", {
        email,
        password
      });

      alert("Password reset successful");

      navigate("/login");

    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8 w-full max-w-md">

        <h2 className="text-2xl font-bold text-white mb-6">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="password"
            required
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"
          />

          <button className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600">
            Reset Password
          </button>

        </form>
      </div>

    </div>
  );
}