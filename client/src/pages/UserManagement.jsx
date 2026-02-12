import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export default function UserManagement() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const fetchUsers = React.useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        }
        setLoadingUsers(false);
    }, [token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleResetPassword = async (userId, userFirstname) => {
        const newPassword = prompt(`Entrez le nouveau mot de passe pour ${userFirstname} :`);
        if (!newPassword) return;

        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword: newPassword.trim() })
            });

            if (res.ok) {
                alert(`✅ Mot de passe de ${userFirstname} réinitialisé avec succès !`);
            } else {
                const data = await res.json();
                alert(`❌ ${data.error || 'Échec de la réinitialisation'}`);
            }
        } catch (err) {
            alert(`❌ Erreur: ${err.message}`);
        }
    };

    return (
        <div className="bg-light min-vh-100">
            {/* Navbar */}
            <nav className="navbar navbar-expand navbar-dark bg-dark shadow-sm sticky-top mb-4">
                <div className="container">
                    <span className="navbar-brand fw-bold text-valentine">Gestion Utilisateurs</span>
                    <ul className="navbar-nav ms-auto gap-3">
                        <li className="nav-item">
                            <Button variant="ghost" className="text-white border-white" size="sm" onClick={() => navigate('/admin')}>
                                🏆 Résultats
                            </Button>
                        </li>
                        <li className="nav-item">
                            <Button variant="ghost" className="text-white border-white" size="sm" onClick={() => navigate('/dashboard')}>
                                &larr; Dashboard
                            </Button>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="container py-4">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="card shadow-sm border-0 rounded-4">
                        <div className="card-header bg-white py-3 border-0">
                            <h3 className="mb-0 text-valentine fw-bold">Liste des Utilisateurs</h3>
                        </div>
                        <div className="card-body p-0">
                            {loadingUsers ? (
                                <div className="text-center py-5"><div className="spinner-border text-valentine"></div></div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4">Utilisateur</th>
                                                <th>Sexe</th>
                                                <th>Rôle</th>
                                                <th className="text-end pe-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="fw-bold">{u.firstname} {u.name}</div>
                                                        </div>
                                                    </td>
                                                    <td>{u.sex === 'Masculin' ? '♂️ Homme' : u.sex === 'Feminin' ? '♀️ Femme' : u.sex}</td>
                                                    <td>{u.is_admin ? <span className="badge bg-danger rounded-pill">Admin</span> : <span className="badge bg-secondary rounded-pill">Utilisateur</span>}</td>
                                                    <td className="text-end pe-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="btn-outline-primary rounded-pill px-3"
                                                            onClick={() => handleResetPassword(u.id, u.firstname)}
                                                        >
                                                            Réinitialiser Password
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
