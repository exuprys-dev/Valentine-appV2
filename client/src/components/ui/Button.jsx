import React from 'react';

export function Button({ className = '', variant = 'primary', ...props }) {
    // Map our variants to bootstrap classes
    const variantMap = {
        primary: 'btn-primary',
        secondary: 'btn-outline-light',
        ghost: 'btn-link text-decoration-none'
    };

    const bootstrapClass = variantMap[variant] || 'btn-primary';

    return (
        <button
            className={`btn ${bootstrapClass} rounded-pill fw-bold px-4 ${className}`}
            {...props}
        />
    );
}
