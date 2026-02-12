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
        hobbies: '',
        sex: '',
        image: null
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        if (e.target.name === 'image') {
            setFormData({ ...formData, image: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        let body;
        let headers = {};

        if (isLogin) {
            body = JSON.stringify({
                name: formData.name,
                password: formData.password
            });
            headers['Content-Type'] = 'application/json';
        } else {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('firstname', formData.firstname);
            data.append('password', formData.password);
            data.append('hobbies', JSON.stringify(formData.hobbies.split(',').map(h => h.trim()).filter(Boolean)));
            data.append('sex', formData.sex);
            if (formData.image) {
                data.append('image', formData.image);
            }
            body = data;
            // No need to set Content-Type for FormData, the browser will set it with boundary
        }

        try {
            const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: body
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Quelque chose s\'est mal passé');

            if (isLogin) {
                login(data.user, data.token);
                navigate('/dashboard');
            } else {
                setIsLogin(true);
                setError('Inscription réussie! Veuillez vous connecter.');
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
                                {isLogin ? 'Ravi de vous revoir' : 'Rejoignez la belle aventure'}
                            </motion.h2>

                            <form onSubmit={handleSubmit}>
                                <Input
                                    label="Nom"
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
                                                label="Prénom"
                                                name="firstname"
                                                value={formData.firstname}
                                                onChange={handleChange}
                                                placeholder="John"
                                                required={!isLogin}
                                            />
                                            <Input
                                                label="Loisirs (séparés par des virgules)"
                                                name="hobbies"
                                                value={formData.hobbies}
                                                onChange={handleChange}
                                                placeholder="Lecture, Cinéma, Codage"
                                            />
                                            <div className="mb-3">
                                                <label className="form-label text-secondary small fw-bold">Photo de profil</label>
                                                <input
                                                    type="file"
                                                    name="image"
                                                    onChange={handleChange}
                                                    accept="image/*"
                                                    className="form-control border-0 bg-light rounded-3"
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label text-secondary small fw-bold">Genre</label>
                                                <select
                                                    name="sex"
                                                    value={formData.sex}
                                                    onChange={handleChange}
                                                    className="form-select border-0 bg-light rounded-3"
                                                    required={!isLogin}
                                                >
                                                    <option value="">Choisir</option>
                                                    <option value="Masculin">Masculin</option>
                                                    <option value="Feminin">Feminin</option>
                                                </select>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Input
                                    label="Mot de passe"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />

                                {error && <div className="alert alert-danger text-center p-2 mb-3">{error}</div>}

                                <Button type="submit" className="w-100 mt-2">
                                    {isLogin ? 'Se connecter' : 'S\'inscrire'}
                                </Button>
                            </form>

                            <div className="mt-4 text-center">
                                <p className="text-secondary mb-0">
                                    {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="btn btn-link text-valentine fw-bold text-decoration-none p-0 ms-2"
                                    >
                                        {isLogin ? 'S\'inscrire' : 'Se connecter'}
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
