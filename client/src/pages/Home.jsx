import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Home() {
    const { user } = useAuth();
    const [news, setNews] = useState([]);
    const [loadingNews, setLoadingNews] = useState(false);

    useEffect(() => {
        if (user) {
            setLoadingNews(true);
            api.get('/news')
                .then(res => setNews(res.data.items || []))
                .catch(err => {
                    console.error("Failed to fetch news", err);
                    setLoadingNews(false);
                    // Keep empty to show 'No news' or handle gracefully without fake data if strictly requested
                    // But for robustness, let's leave state empty so UI shows "No news available" instead of crashing
                    setNews([]);
                })
                .finally(() => setLoadingNews(false));
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
                            Master Your Money with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
                                Mathematical Precision
                            </span>
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 mb-10">
                            FinWiz uses advanced algorithms to track expenses, detect subscriptions, and forecast your savings without compromising your privacy.
                        </p>

                        {!user ? (
                            <div className="flex justify-center gap-4">
                                <Link to="/signup">
                                    <Button size="lg" className="rounded-full px-8 text-lg shadow-lg shadow-primary-500/30">
                                        Get Started Free
                                    </Button>
                                </Link>
                                <Link to="/login">
                                    <Button variant="outline" size="lg" className="rounded-full px-8 text-lg bg-white">
                                        Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex justify-center gap-4">
                                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                                    <Button size="lg" className="rounded-full px-8 text-lg shadow-lg shadow-primary-500/30">
                                        Go to {user.role === 'admin' ? 'Admin Console' : 'Dashboard'}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 inset-x-0 h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                </div>
            </section>

            {/* News Section (Only if logged in for now, or teaser) */}
            {user ? (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-3xl font-bold text-slate-900">Latest Financial News</h2>
                            <span className="text-sm text-slate-500">Powered by MarketAux</span>
                        </div>

                        {loadingNews ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="animate-pulse">
                                        <div className="bg-slate-200 h-48 rounded-lg mb-4"></div>
                                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {news.length > 0 ? news.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="h-full hover:shadow-xl transition-shadow duration-300 border border-slate-100">
                                            {item.imageUrl && (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-48 object-cover rounded-md mb-4"
                                                />
                                            )}
                                            <div className="flex flex-col h-full">
                                                <span className="text-xs text-primary-600 font-semibold uppercase tracking-wider mb-2">
                                                    {item.source}
                                                </span>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">
                                                        {item.title}
                                                    </a>
                                                </h3>
                                                <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow">
                                                    {item.summary || item.description}
                                                </p>
                                                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(item.publishedAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                                                    >
                                                        Read more &rarr;
                                                    </a>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )) : (
                                    <div className="col-span-full text-center py-10 text-slate-500">
                                        No news available at the moment.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <section className="py-20 bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-8">Join FinWiz to access premium insights</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left mt-12">
                            <div className="p-6 bg-slate-800 rounded-xl">
                                <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4 text-2xl">📊</div>
                                <h3 className="text-xl font-bold mb-2">Smart Analytics</h3>
                                <p className="text-slate-400">Track every penny with beautiful, intuitive charts and reports.</p>
                            </div>
                            <div className="p-6 bg-slate-800 rounded-xl">
                                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center mb-4 text-2xl">🔄</div>
                                <h3 className="text-xl font-bold mb-2">Subscription Detection</h3>
                                <p className="text-slate-400">Automatically find and manage recurring payments to stop leaks.</p>
                            </div>
                            <div className="p-6 bg-slate-800 rounded-xl">
                                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center mb-4 text-2xl">🔮</div>
                                <h3 className="text-xl font-bold mb-2">Future Forecasting</h3>
                                <p className="text-slate-400">Predict your savings with mathematical models, no AI needed.</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
