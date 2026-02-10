import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [imgErrors, setImgErrors] = useState({});

    const handleImgError = (id) => {
        setImgErrors(prev => ({ ...prev, [id]: true }));
    };

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

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
    }, [token, API_URL]);

    React.useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const runMatching = async () => {
        if (!confirm("Are you sure you want to generate matches? This might overwrite existing matches.")) return;

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
                fetchMatches(); // Refresh list
            } else {
                setStatus('❌ ' + (data.error || 'Failed'));
            }
        } catch (err) {
            setStatus('❌ Error: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="bg-light min-vh-100 position-relative">
            <div className="position-absolute top-0 start-0 m-3" style={{ zIndex: 10 }}>
                <Button variant="ghost" className="text-decoration-none" onClick={() => navigate('/dashboard')}>&larr; Retour</Button>
            </div>
            <div className="container py-5">
                <div className="row justify-content-center mb-5">
                    <div className="col-lg-6">
                        <div className="card shadow-lg border-0 rounded-4">
                            <div className="card-body p-5 text-center">
                                <h1 className="fw-bold mb-2 text-valentine">Panneau d'administration</h1>
                                <p className="text-muted mb-4">Centre de contrôle de Cupidon</p>

                                <div className="d-grid gap-3">
                                    <Button
                                        onClick={runMatching}
                                        disabled={loading}
                                        className="py-3 fs-5 btn-primary"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Matching...
                                            </>
                                        ) : '💘 Lancer le test de compatibilité'}
                                    </Button>

                                    {status && (
                                        <div className={`alert ${status.startsWith('✅') ? 'alert-success' : 'alert-danger'} mt-3`} role="alert">
                                            {status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        <h2 className="text-center mb-4 text-valentine fw-bold">Liste des Matchs</h2>
                        {loadingMatches ? (
                            <div className="text-center">
                                <div className="spinner-border text-valentine" role="status"></div>
                            </div>
                        ) : matches.length > 0 ? (
                            <div className="row g-4">
                                {matches.map((match) => (
                                    <div key={match.id} className="col-md-6 col-lg-4">
                                        <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                                            <div className="card-header bg-valentine text-white text-center py-2">
                                                Match #{match.id}
                                            </div>
                                            <div className="card-body p-3">
                                                <div className="d-flex flex-column gap-3">
                                                    {match.users.map((user) => (
                                                        <div key={user.id} className="d-flex align-items-center gap-3 p-2 bg-light rounded-3">
                                                            {user.image_url && !imgErrors[user.id] ? (
                                                                <img
                                                                    src={user.image_url.startsWith('http') ? user.image_url : `${API_URL}${user.image_url}`}
                                                                    alt={user.firstname}
                                                                    className="rounded-circle shadow-sm"
                                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                                    onError={() => handleImgError(user.id)}
                                                                />
                                                            ) : (
                                                                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '50px', height: '50px' }}>
                                                                    👤
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="fw-bold">{user.firstname} {user.name}</div>
                                                                <div className="small text-muted">{user.sex}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted">Aucun match pour le moment.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
