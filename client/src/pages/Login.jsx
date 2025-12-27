import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(formData.email, formData.password);
        if (res.success) {
            if (res.user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(res.message);
        }
        setLoading(false);
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Sign in to FinWiz</h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                        <div className="space-y-4">
                            <Input
                                type="email"
                                required
                                label="Email address"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <Input
                                type="password"
                                required
                                label="Password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full"
                            >
                                Sign in
                            </Button>
                        </div>
                    </form>
                    <div className="text-center">
                        <Link to="/signup" className="text-sm text-primary-600 hover:text-primary-500">
                            Don't have an account? Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
