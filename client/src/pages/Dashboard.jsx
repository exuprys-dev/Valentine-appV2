import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
        fetch(`${API_URL}/api/user/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setMatchData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [token]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand navbar-light bg-white shadow-sm mb-5">
                <div className="container">
                    <span className="navbar-brand text-valentine fw-bold">Valentine App</span>
                    <div className="d-flex gap-2">
                        <Button variant="ghost" onClick={() => navigate('/admin')}>Administration</Button>
                        <Button variant="ghost" onClick={handleLogout}>Se déconnecter</Button>
                    </div>
                </div>
            </nav>

            {loading ? (
                <div className="text-center mt-5">
                    <div className="spinner-border text-valentine" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            ) : (
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card shadow-sm border-0 mb-5 rounded-4"
                    >
                        <div className="card-body p-4 p-md-5">
                            <h2 className="card-title fw-bold mb-3">Bonjour, {matchData?.user.firstname} {matchData?.user.name} !</h2>
                            <div className="d-flex flex-wrap gap-2">
                                {matchData?.user.hobbies.map((hobby, i) => (
                                    <span key={i} className="badge bg-secondary rounded-pill fw-normal fs-6">
                                        {hobby}
                                    </span>
                                ))}
                                <span className="badge bg-secondary rounded-pill fw-normal fs-6">{matchData?.user.sex}</span>
                            </div>
                        </div>
                    </motion.div>

                    {matchData?.matches ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="card border-0 bg-valentine text-white shadow rounded-4 overflow-hidden"
                            style={{ background: 'linear-gradient(45deg, #ff3366, #ff6b6b)' }}
                        >
                            <div className="card-body p-5 text-center text-white">
                                <h3 className="mb-4">💖 Vous avez été matché avec :</h3>
                                <div className="row justify-content-center g-4">
                                    {matchData.matches.map(partner => (
                                        <div key={partner.id} className="col-md-auto">
                                            <div className="bg-white text-dark p-4 rounded-4 shadow h-100" style={{ minWidth: '220px' }}>
                                                <div className="display-4 mb-3">👤</div>
                                                <h4 className="fw-bold mb-2">{partner.firstname} {partner.name}</h4>
                                                <div className="d-flex flex-wrap justify-center gap-1">
                                                    {partner.hobbies.map((h, i) => (
                                                        <span key={i} className="badge bg-light text-dark border">{h}</span>
                                                    ))}
                                                    <span className="badge bg-secondary rounded-pill fw-normal fs-6">{partner.sex}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center mt-5 opacity-75"
                        >
                            <div className="display-1 mb-3">⏳</div>
                            <h3 className="h2">En attente du coup de foudre...</h3>
                            <p className="text-muted">L'administrateur n'a pas encore lancé le processus.</p>
                            <p className="text-muted">Ou vous n'avez juste pas de partenaire</p>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
