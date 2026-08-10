import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-10 w-auto max-w-[120px]',
    md: 'h-12 w-auto max-w-[160px]',
    lg: 'h-14 w-auto max-w-[200px]'
  };

  return (
    <Link
      to="/"
      className={`flex items-center gap-2 group ${className}`}
      aria-label="Ir al inicio"
    >
      <img
        src="/logo_foro_coar.svg"
        alt="Logo COAR"
        className={`${sizeClasses[size]} transition-transform group-hover:scale-105`}
        style={{ width: 'auto', height: 'auto' }}
      />
    </Link>
  );
}
