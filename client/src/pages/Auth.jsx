/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        firstname: '',
        password: '',
        hobbies: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin
            ? { name: formData.name, password: formData.password }
            : {
                name: formData.name,
                firstname: formData.firstname,
                password: formData.password,
                hobbies: formData.hobbies.split(',').map(h => h.trim()).filter(Boolean)
            };

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            if (isLogin) {
                login(data.user, data.token);
                navigate('/dashboard');
            } else {
                setIsLogin(true);
                setError('Registration successful! Please log in.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-center py-5">
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <motion.div
                        layout
                        className="card shadow-lg p-4 border-0 rounded-4 bg-white"
                    >
                        <div className="card-body">
                            <motion.h2
                                key={isLogin ? 'login' : 'register'}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center mb-4 text-valentine fw-bold"
                            >
                                {isLogin ? 'Welcome Back' : 'Join Valentine'}
                            </motion.h2>

                            <form onSubmit={handleSubmit}>
                                <Input
                                    label="Last Name (Identifier)"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    required
                                />

                                <AnimatePresence>
                                    {!isLogin && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <Input
                                                label="First Name"
                                                name="firstname"
                                                value={formData.firstname}
                                                onChange={handleChange}
                                                placeholder="John"
                                                required={!isLogin}
                                            />
                                            <Input
                                                label="Hobbies (comma separated)"
                                                name="hobbies"
                                                value={formData.hobbies}
                                                onChange={handleChange}
                                                placeholder="Reading, Cinema, Coding"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />

                                {error && <div className="alert alert-danger text-center p-2 mb-3">{error}</div>}

                                <Button type="submit" className="w-100 mt-2">
                                    {isLogin ? 'Sign In' : 'Sign Up'}
                                </Button>
                            </form>

                            <div className="mt-4 text-center">
                                <p className="text-secondary mb-0">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="btn btn-link text-valentine fw-bold text-decoration-none p-0 ms-2"
                                    >
                                        {isLogin ? 'Register' : 'Login'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
