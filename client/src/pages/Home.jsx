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
                .catch(() => setNews([]))
                .finally(() => setLoadingNews(false));
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
            <Navbar />

            {/* ================= HERO ================= */}
            <section className="relative pt-24 pb-32">

                {/* Background glow */}
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/30 blur-3xl rounded-full" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/30 blur-3xl rounded-full" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
                    >
                        Control Your Finances with
                        <br />
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            Precision & Clarity
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-6 max-w-2xl mx-auto text-lg text-slate-400"
                    >
                        Track expenses, detect subscriptions, and forecast savings
                        using powerful mathematical models — without selling your data.
                    </motion.p>

                    <div className="mt-10 flex justify-center gap-4 flex-wrap">
                        {!user ? (
                            <>
                                <Link to="/signup">
                                    <Button className="px-8 py-3 rounded-full text-lg shadow-lg shadow-indigo-500/20">
                                        Get Started Free
                                    </Button>
                                </Link>

                                <Link to="/login">
                                    <Button
                                        variant="outline"
                                        className="px-8 py-3 rounded-full text-lg border-white/20 text-white hover:bg-white/5"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                                <Button className="px-8 py-3 rounded-full text-lg shadow-lg shadow-indigo-500/20">
                                    Go to {user.role === 'admin' ? 'Admin Console' : 'Dashboard'}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ================= FEATURES ================= */}
            {!user && (
                <section className="py-24 bg-slate-900">
                    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">

                        {[
                            {
                                icon: "📊",
                                title: "Smart Analytics",
                                desc: "Beautiful dashboards that turn complex data into clear insights."
                            },
                            {
                                icon: "🔄",
                                title: "Subscription Detection",
                                desc: "Automatically identify recurring charges and eliminate waste."
                            },
                            {
                                icon: "🔮",
                                title: "Savings Forecasting",
                                desc: "Predict future savings with advanced weighted models."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-lg"
                            >
                                <div className="text-3xl mb-4">{item.icon}</div>
                                <h3 className="text-xl font-semibold mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-slate-400">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* ================= NEWS SECTION ================= */}
            {user && (
                <section className="py-24 bg-slate-900">
                    <div className="max-w-7xl mx-auto px-6">

                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-3xl font-bold">
                                Latest Financial News
                            </h2>
                            <span className="text-sm text-slate-500">
                                Market Updates
                            </span>
                        </div>

                        {loadingNews ? (
                            <div className="grid md:grid-cols-3 gap-8">
                                {[1,2,3].map(i => (
                                    <div key={i} className="animate-pulse h-64 bg-white/5 rounded-xl"></div>
                                ))}
                            </div>
                        ) : news.length > 0 ? (
                            <div className="grid md:grid-cols-3 gap-8">
                                {news.map((item, i) => (
    <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md hover:bg-white/10 transition"
    >
        {/* 🔥 NEWS IMAGE */}
        {item.imageUrl || item.urlToImage ? (
            <div className="h-48 w-full overflow-hidden">
                <img
                    src={item.imageUrl || item.urlToImage}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
            </div>
        ) : (
            <div className="h-48 w-full bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
                No Image Available
            </div>
        )}

        <div className="p-6">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wide">
                {item.source}
            </span>

            <h3 className="mt-2 text-lg font-semibold line-clamp-2">
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-400 transition"
                >
                    {item.title}
                </a>
            </h3>

            <p className="mt-3 text-sm text-slate-400 line-clamp-3">
                {item.summary || item.description}
            </p>

            <div className="mt-6 text-xs text-slate-500">
                {new Date(item.publishedAt).toLocaleDateString()}
            </div>
        </div>
    </motion.div>
))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 py-10">
                                No news available at the moment.
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}