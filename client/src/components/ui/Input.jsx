import React from 'react';

export function Input({ className = '', label, ...props }) {
    return (
        <div className="mb-3 w-100">
            {label && <label className="form-label fw-medium">{label}</label>}
            <input
                className={`form-control form-control-lg rounded-3 ${className}`}
                {...props}
            />
        </div>
    );
}
