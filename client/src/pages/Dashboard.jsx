import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const { token, logout, user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.isAdmin === true || user?.isAdmin === 1 || user?.isAdmin === 'true';
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgErrors, setImgErrors] = useState({});
    const [uploading, setUploading] = useState(false);

    const handleImgError = (id) => {
        setImgErrors(prev => ({ ...prev, [id]: true }));
    };

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

    const fetchDashboard = React.useCallback(() => {
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
    }, [token, API_URL]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const handleImageUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_URL}/api/user/profile-image`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                // Clear errors for the user image to force reload
                setImgErrors(prev => ({ ...prev, user: false }));
                fetchDashboard();
            } else {
                const data = await res.json();
                alert(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau');
        } finally {
            setUploading(false);
        }
    };

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
                        {matchData?.settings?.voting_enabled ? (
                            <Button variant="ghost" onClick={() => navigate('/vote')}>Voter pour le meilleur couple 💖</Button>
                        ) : isAdmin && (
                            <Button variant="ghost" className="text-valentine fw-bold" onClick={() => navigate('/vote')}>🏆 Voir les Résultats</Button>
                        )}
                        {isAdmin && (
                            <Button variant="ghost" onClick={() => navigate('/admin/users')}>👥 Gestion Utilisateurs</Button>
                        )}
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
                        <div className="card-body p-4 p-md-5 d-flex align-items-center gap-4">
                            <div className="position-relative group" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('profile-upload').click()}>
                                {(matchData?.user.image_url && matchData.user.image_url !== 'null' && matchData.user.image_url !== 'undefined' && !imgErrors['user']) ? (
                                    <img
                                        src={matchData.user.image_url.startsWith('http') ? matchData.user.image_url : `${API_URL}${matchData.user.image_url}`}
                                        alt="Profile"
                                        className="rounded-circle shadow-sm"
                                        style={{ width: '140px', height: '140px', objectFit: 'cover' }}
                                        onError={() => handleImgError('user')}
                                    />
                                ) : (
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '140px', height: '140px', fontSize: '4rem' }}>
                                        👤
                                    </div>
                                )}
                                <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center bg-dark bg-opacity-25 opacity-0 hover-opacity-100 transition-opacity" style={{ transition: '0.3s' }}>
                                    <span className="text-white small fw-bold">Modifier</span>
                                </div>
                                {uploading && (
                                    <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-75">
                                        <div className="spinner-border spinner-border-sm text-valentine" role="status"></div>
                                    </div>
                                )}
                                <input
                                    id="profile-upload"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageUpdate}
                                    disabled={uploading}
                                />
                            </div>
                            <div>
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
                        </div>
                    </motion.div>

                    {!user?.isAdmin && (
                        <>
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
                                                        {(partner.image_url && partner.image_url !== 'null' && partner.image_url !== 'undefined' && !imgErrors[partner.id]) ? (
                                                            <img
                                                                src={partner.image_url.startsWith('http') ? partner.image_url : `${API_URL}${partner.image_url}`}
                                                                alt={partner.firstname}
                                                                className="rounded-circle mb-3 shadow-sm"
                                                                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                                onError={() => handleImgError(partner.id)}
                                                            />
                                                        ) : (
                                                            <div className="display-1 mb-3">👤</div>
                                                        )}
                                                        <h4 className="fw-bold mb-2">{partner.firstname} {partner.name}</h4>
                                                        <div className="d-flex flex-wrap justify-center gap-1">
                                                            {partner.hobbies.map((h, i) => (
                                                                <span key={i} className="badge bg-secondary rounded-pill fw-normal fs-6">{h}</span>
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
