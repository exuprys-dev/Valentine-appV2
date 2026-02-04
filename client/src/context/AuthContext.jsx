import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContextObject';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            if (token) {
                // Decode token or fetch user profile if needed
                // For simplicity, we assume we might store user in localStorage or just check if token exists
                // Real app would verify token with backend
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch (e) {
                        console.error('Failed to parse user from localStorage:', e);
                    }
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const login = (userData, newToken) => {
        setUser(userData);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext>
    );
};


