import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {

        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await login(formData.email, formData.password);

            if (res.success) {
                // Check user role and redirect accordingly
                if (res.user?.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(res.message || 'Login failed. Please try again.');
            }
        } catch (err) {
            console.error("Login error:", err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden bg-slate-900">

            {/* ================= LEFT BRAND PANEL ================= */}

            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-16 text-white">

                {/* Glow overlays */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-lg">

                    <h1 className="text-4xl font-bold tracking-tight mb-6">
                        Welcome Back to FinWiz
                    </h1>

                    <p className="text-indigo-100 text-lg leading-relaxed mb-10">
                        Log in to access your dashboard, track your finances,
                        manage subscriptions, and view AI-powered forecasts.
                    </p>

                    <div className="space-y-4 text-indigo-200 text-sm">
                        <p>✔ Smart budgeting tools</p>
                        <p>✔ AI-driven financial insights</p>
                        <p>✔ Goal tracking & analytics</p>
                        <p>✔ Premium investment recommendations</p>
                    </div>

                </div>

            </div>

            {/* ================= RIGHT GLASS FORM ================= */}

            <div className="flex flex-1 items-center justify-center relative px-6 py-12">

                {/* Background glow */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/30 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl" />

                <div className="relative z-10 w-full max-w-md">

                    <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-8">

                        {/* Header */}
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-white">
                                Sign in
                            </h2>
                            <p className="text-slate-300 text-sm mt-2">
                                Access your FinWiz account
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 bg-red-500/10 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">

                            <GlassInput
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value
                                    })
                                }
                            />

                            <GlassInput
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value
                                    })
                                }
                            />

                            {/* Forgot Password Link */}
                            <div className="flex justify-end text-sm">
                                <Link
                                    to="/forgot-password"
                                    className="text-indigo-400 hover:text-indigo-300"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>

                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center text-sm text-slate-300">
                            Don’t have an account?{" "}
                            <Link
                                to="/signup"
                                className="text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Sign up
                            </Link>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}


/* ================= GLASS INPUT ================= */

function GlassInput({ label, type, value, onChange }) {

    return (
        <div>

            <label className="block text-sm text-slate-300 mb-2">
                {label}
            </label>

            <input
                type={type}
                required
                value={value}
                onChange={onChange}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />

        </div>
    );
}
