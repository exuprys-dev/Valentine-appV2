import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function Maintenance() {
    const navigate = useNavigate();

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
            <div className="row w-100 justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card shadow-lg p-5 border-0 rounded-4 bg-white text-center">
                        <div className="card-body">
                            {/* Cupidon Icon */}
                            <div className="mb-4">
                                <span style={{ fontSize: '80px' }}>💘</span>
                            </div>

                            {/* Title */}
                            <h2 className="text-valentine fw-bold mb-4">
                                Cupidon est en vacances
                            </h2>

                            {/* Message */}
                            <p className="text-secondary fs-5 mb-4">
                                Si vous avez oublié vos identifiants, écrivez-lui sur WhatsApp
                            </p>

                            {/* WhatsApp Number */}
                            <div className="alert alert-info border-0 bg-light mb-4">
                                <h3 className="text-valentine mb-0">
                                    📱 40532331
                                </h3>
                            </div>

                            {/* WhatsApp Button */}
                            <a
                                href="https://wa.me/22940532331"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-success btn-lg mb-3 w-100"
                            >
                                <span className="me-2">💬</span>
                                Contactez sur WhatsApp
                            </a>

                            {/* Back to Login */}
                            <Button
                                onClick={() => navigate('/')}
                                className="w-100"
                                variant="outline"
                            >
                                Retour à la connexion
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
