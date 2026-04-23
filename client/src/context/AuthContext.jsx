import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/user/profile');
                    console.log("DEBUG AuthContext checkAuth data:", data);
                    setUser(data.user || data);
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            
            let userData;
            // Assuming login returns user object or we fetch it
            if (data.user) {
                userData = data.user;
                setUser(data.user);
            } else {
                // Fetch profile if not provided
                const profile = await api.get('/user/profile');
                userData = profile.data;
                setUser(profile.data);
            }
            
            // IMPORTANT: Return the user object along with success
            return { 
                success: true, 
                user: userData  // ← This is the key fix!
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const signup = async (userData) => {
        try {
            const { data } = await api.post('/auth/signup', userData);
            localStorage.setItem('token', data.token);
            if (data.user) {
                setUser(data.user);
            } else {
                const profile = await api.get('/user/profile');
                setUser(profile.data);
            }
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Signup failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
