import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function VotingPage() {
    const { token, logout, user } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);
    const [votingMatchId, setVotingMatchId] = useState(null);
    const [imgErrors, setImgErrors] = useState({});
    const [isVotingEnabled, setIsVotingEnabled] = useState(true);

    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

    const fetchData = React.useCallback(async () => {
        try {
            // Fetch status (user vote status AND global setting)
            const statusRes = await fetch(`${API_URL}/api/votes/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const statusData = await statusRes.json();
            setHasVoted(statusData.hasVoted);

            // We also need global status here to show a message if disabled
            const dashboardRes = await fetch(`${API_URL}/api/user/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dashboardData = await dashboardRes.json();
            const votingOpen = dashboardData.settings?.voting_enabled === true || dashboardData.settings?.voting_enabled === 'true';
            setIsVotingEnabled(votingOpen);

            // Fetch results/matches (backend will handle privacy)
            const resultsRes = await fetch(`${API_URL}/api/votes/results`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const resultsData = await resultsRes.json();
            setMatches(resultsData);
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
        } finally {
            setLoading(false);
        }
    }, [token, API_URL]);

    const isAdmin = user?.isAdmin === true || user?.isAdmin === 1 || user?.isAdmin === 'true';

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVote = async (matchId) => {
        if (hasVoted) return;

        const confirmVote = window.confirm("Êtes-vous sûr de votre choix ? Vous ne pourrez pas changer votre vote par la suite. 💖");
        if (!confirmVote) return;

        setVotingMatchId(matchId);
        try {
            const res = await fetch(`${API_URL}/api/votes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ matchId })
            });

            if (res.ok) {
                setHasVoted(true);
                fetchData(); // Refresh results
            } else {
                const data = await res.json();
                alert(data.error || 'Erreur lors du vote');
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau');
        } finally {
            setVotingMatchId(null);
        }
    };

    const handleImgError = (id) => {
        setImgErrors(prev => ({ ...prev, [id]: true }));
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
                    <span className="navbar-brand text-valentine fw-bold" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}> Valentine App</span>
                    <div className="d-flex gap-2">
                        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Tableau de bord</Button>
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
                <div className="container pb-5">
                    <header className="text-center mb-5">
                        <h1 className="display-4 fw-bold text-valentine">
                            {isVotingEnabled ? 'Votez pour le Meilleur Couple ! 💖' : 'Résultats du Concours 🏆'}
                        </h1>
                        <p className="lead text-muted">
                            {isVotingEnabled
                                ? (hasVoted ? "Merci d'avoir voté ! Voici les résultats actuels." : "Découvrez les couples formés et choisissez votre préféré.")
                                : "Les votes sont clos ! Voici nos couples stars."}
                        </p>
                    </header>

                    <div className="row g-4">
                        {(() => {
                            const maxVotes = Math.max(...matches.map(m => m.vote_count), 0);
                            return matches.map((match, index) => {
                                const isWinner = !isVotingEnabled && match.vote_count === maxVotes && maxVotes > 0;
                                return (
                                    <div key={match.match_id} className="col-lg-6">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`card h-100 border-0 shadow-sm rounded-4 overflow-hidden ${isWinner ? 'border border-warning border-3' : ''} ${hasVoted ? 'bg-white' : 'hover-shadow transition-all'}`}
                                            style={isWinner ? { boxShadow: '0 0 20px rgba(255, 193, 7, 0.3)' } : {}}
                                        >
                                            <div className="card-body p-4">
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    {isWinner && (
                                                        <span className="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold me-2">
                                                            🏆 GAGNANT
                                                        </span>
                                                    )}
                                                    {(isAdmin || !isVotingEnabled) ? (
                                                        <span className="badge bg-valentine rounded-pill px-3 py-2">
                                                            {match.vote_count} {match.vote_count > 1 ? 'votes' : 'vote'}
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-secondary rounded-pill px-3 py-2">
                                                            Couples formés
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="d-flex align-items-center justify-content-center gap-3 gap-md-5 mb-4">
                                                    {match.users.map((user, i) => (
                                                        <React.Fragment key={user.id}>
                                                            <div className="text-center">
                                                                <div className="position-relative mb-2">
                                                                    {(user.image_url && user.image_url !== 'null' && user.image_url !== 'undefined' && !imgErrors[user.id]) ? (
                                                                        <img
                                                                            src={user.image_url.startsWith('http') ? user.image_url : `${API_URL}${user.image_url}`}
                                                                            alt={user.firstname}
                                                                            className="rounded-circle shadow-sm"
                                                                            style={{ width: '140px', height: '140px', objectFit: 'cover' }}
                                                                            onError={() => handleImgError(user.id)}
                                                                        />
                                                                    ) : (
                                                                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '140px', height: '140px', fontSize: '4rem' }}>
                                                                            👤
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {isWinner && <div className="display-6 text-warning mb-2 animate-bounce">👑</div>}
                                                                <h5 className="mb-0 fw-bold">{user.firstname} {user.name}</h5>
                                                            </div>
                                                            {i === 0 && <div className="display-6 text-valentine opacity-50">❤️</div>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                {!hasVoted && isVotingEnabled && (
                                                    <div className="text-center">
                                                        <Button
                                                            className="w-100 py-3 rounded-3 fw-bold"
                                                            style={{ background: 'linear-gradient(45deg, #ff3366, #ff6b6b)', border: 'none' }}
                                                            onClick={() => handleVote(match.match_id)}
                                                            disabled={votingMatchId === match.match_id}
                                                        >
                                                            {votingMatchId === match.match_id ? (
                                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                            ) : 'Voter pour ce couple 💖'}
                                                        </Button>
                                                    </div>
                                                )}

                                                {(hasVoted || !isVotingEnabled) && (isAdmin || !isVotingEnabled) && (
                                                    <div className="progress mt-3" style={{ height: '8px' }}>
                                                        <div
                                                            className="progress-bar bg-valentine"
                                                            role="progressbar"
                                                            style={{
                                                                width: `${(match.vote_count / Math.max(...matches.map(m => m.vote_count), 1)) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {matches.length === 0 && (
                        <div className="text-center mt-5 py-5">
                            <div className="display-1 mb-3">🤝</div>
                            <h3>Le vote n'est pas encore ouvert ou les couples ne sont pas formés.</h3>
                            <p className="text-muted">Revenez plus tard pour voter pour votre couple préféré !</p>
                            <Button variant="valentine" onClick={() => navigate('/dashboard')}>Retour au tableau de bord</Button>
                        </div>
                    )}
                </div>
            )}
            <style>{`
                .text-valentine { color: #ff3366; }
                .bg-valentine { background-color: #ff3366; }
                .hover-shadow:hover { transform: translateY(-5px); box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
                .transition-all { transition: all 0.3s ease; }
            `}</style>
        </div>
    );
}
