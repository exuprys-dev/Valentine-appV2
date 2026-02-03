import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const runMatching = async () => {
        if (!confirm("Are you sure you want to generate matches? This might overwrite existing matches.")) return;

        setLoading(true);
        setStatus('Running algorithm...');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/api/admin/match`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('✅ ' + data.message);
            } else {
                setStatus('❌ ' + (data.error || 'Failed'));
            }
        } catch (err) {
            setStatus('❌ Error: ' + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-col flex-md-row align-items-center justify-center p-4 relative">
            <div className="position-absolute top-0 start-0 m-3">
                <Button variant="ghost" className="text-decoration-none" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</Button>
            </div>

            <div className="card shadow-lg border-0 rounded-4 w-100" style={{ maxWidth: '500px' }}>
                <div className="card-body p-5 text-center">
                    <h1 className="fw-bold mb-2 text-valentine">Admin Panel</h1>
                    <p className="text-muted mb-4">Cupid's Control Center</p>

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
                            ) : '💘 Launch Compatibility Test'}
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
    );
}
