import { useState } from 'react';
import { AuthContext } from './AuthContextObject';

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
                return null;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState(false); // No longer loading asynchronously

    // If you ever need to verify the token with the backend on boot, 
    // you could do it here, but keep loading=false initially if we have cached data
    // to avoid the redirect.

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


