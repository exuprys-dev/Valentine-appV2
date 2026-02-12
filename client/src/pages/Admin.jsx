import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export default function Admin() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [votingEnabled, setVotingEnabled] = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false);
    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [imgErrors, setImgErrors] = useState({});

    const handleImgError = (id) => {
        setImgErrors(prev => ({ ...prev, [id]: true }));
    };

    const fetchMatches = React.useCallback(async () => {
        setLoadingMatches(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/matches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMatches(data);
            }
        } catch (err) {
            console.error(err);
        }
        setLoadingMatches(false);
    }, [token]);

    const fetchSettings = React.useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVotingEnabled(data.voting_enabled === 'true' || data.voting_enabled === true);
            }
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    React.useEffect(() => {
        fetchSettings();
        fetchMatches();
    }, [fetchSettings, fetchMatches]);

    const runMatching = async () => {
        if (!confirm("Voulez-vous vraiment générer les matchs ? Cela écrasera les matchs existants.")) return;

        setLoading(true);
        setStatus('Algorithme en cours...');

        try {
            const res = await fetch(`${API_URL}/api/admin/match`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('✅ ' + data.message);
                fetchMatches();
            } else {
                setStatus('❌ ' + (data.error || 'Échec'));
            }
        } catch (err) {
            setStatus('❌ Erreur: ' + err.message);
        }
        setLoading(false);
    };

    const toggleVoting = async () => {
        setLoadingToggle(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/settings/voting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ enabled: !votingEnabled })
            });

            if (res.ok) {
                setVotingEnabled(!votingEnabled);
                setStatus(`✅ Système de vote ${!votingEnabled ? 'activé' : 'désactivé'}`);
            } else {
                setStatus('❌ Échec de la modification du statut de vote');
            }
        } catch (err) {
            setStatus('❌ Erreur: ' + err.message);
        } finally {
            setLoadingToggle(false);
        }
    };

    return (
        <div className="bg-light min-vh-100">
            {/* Admin Navbar */}
            <nav className="navbar navbar-expand navbar-dark bg-dark shadow-sm sticky-top mb-4">
                <div className="container">
                    <span className="navbar-brand fw-bold text-valentine">Administration</span>
                    <ul className="navbar-nav ms-auto gap-3">
                        <li className="nav-item">
                            <Button variant="ghost" className="text-white border-white" size="sm" onClick={() => navigate('/admin/users')}>
                                👥 Gestion Utilisateurs
                            </Button>
                        </li>
                        <li className="nav-item">
                            <Button variant="ghost" className="text-white border-white" size="sm" onClick={() => navigate('/dashboard')}>&larr; Tableau de bord</Button>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="container py-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="row justify-content-center mb-5">
                        <div className="col-lg-6">
                            <div className="card shadow-lg border-0 rounded-4">
                                <div className="card-body p-5 text-center">
                                    <h2 className="fw-bold mb-4 text-valentine text-uppercase ls-1">Contrôle du Concours</h2>
                                    <div className="d-grid gap-3">
                                        <Button
                                            onClick={runMatching}
                                            disabled={loading}
                                            className="py-3 fs-5 btn-primary rounded-pill shadow-sm"
                                        >
                                            {loading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span>Génération...</>
                                            ) : '💘 Relancer le Matching'}
                                        </Button>

                                        <Button
                                            onClick={toggleVoting}
                                            disabled={loadingToggle}
                                            variant={votingEnabled ? "outline" : "primary"}
                                            className={`py-3 fs-5 rounded-pill shadow-sm ${votingEnabled ? 'btn-outline-danger' : 'btn-success'}`}
                                        >
                                            {loadingToggle ? (
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                            ) : votingEnabled ? '🔓 Clôturer le Vote' : '🔒 Ouvrir le Vote'}
                                        </Button>

                                        {status && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`alert ${status.startsWith('✅') ? 'alert-success' : 'alert-danger'} mt-3 border-0 rounded-4 shadow-sm`}>
                                                {status}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 justify-content-center">
                        <div className="col-12 text-center mb-4">
                            <h3 className="text-valentine fw-bold text-uppercase ls-2">Liste des Matchs</h3>
                            <hr className="bg-valentine border-2 w-25 mx-auto" style={{ height: '3px', opacity: 1 }} />
                        </div>
                        {loadingMatches ? (
                            <div className="text-center py-5"><div className="spinner-border text-valentine" style={{ width: '3rem', height: '3rem' }}></div></div>
                        ) : matches.length > 0 ? (
                            <div className="row g-4">
                                {matches.map((match) => (
                                    <div key={match.id} className="col-md-6 col-lg-6">
                                        <motion.div whileHover={{ scale: 1.02 }} className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                                            <div className="card-header bg-valentine text-white text-center py-2 border-0">
                                                <span className="fw-bold fs-6">Couple Formé 💖</span>
                                            </div>
                                            <div className="card-body p-4 bg-white">
                                                <div className="d-flex align-items-center justify-content-center gap-4">
                                                    {match.users.map((user, i) => (
                                                        <React.Fragment key={user.id}>
                                                            <div className="text-center" style={{ flex: 1 }}>
                                                                <div className="position-relative d-inline-block mb-2">
                                                                    {(user.image_url && user.image_url !== 'null' && user.image_url !== 'undefined' && !imgErrors[user.id]) ? (
                                                                        <img
                                                                            src={user.image_url.startsWith('http') ? user.image_url : `${API_URL}${user.image_url}`}
                                                                            alt={user.firstname}
                                                                            className="rounded-circle shadow-sm border border-2 border-white"
                                                                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                                            onError={() => handleImgError(user.id)}
                                                                        />
                                                                    ) : (
                                                                        <div className="bg-light rounded-circle shadow-sm border border-2 border-white d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                                                                            👤
                                                                        </div>
                                                                    )}
                                                                    <span className={`position-absolute bottom-0 end-0 p-1 border border-light rounded-circle bg-${user.sex === 'Masculin' ? 'primary' : 'danger'}`} style={{ width: '12px', height: '12px' }}></span>
                                                                </div>
                                                                <div className="fw-bold text-dark text-truncate fs-5" title={`${user.firstname} ${user.name}`}>{user.firstname} {user.name}</div>
                                                            </div>
                                                            {i === 0 && <div className="text-valentine fs-4 animate-pulse">❤️</div>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted col-12 py-5">Aucun match pour le moment.</p>
                        )}
                    </div>
                </motion.div>
            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-pulse {
                    animation: pulse 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
