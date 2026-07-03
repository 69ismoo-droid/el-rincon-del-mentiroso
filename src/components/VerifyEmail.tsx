import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Enlace de verificación inválido');
      return;
    }

    handleVerification();
  }, [token, email]);

  const handleVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token!,
          email: decodeURIComponent(email!),
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Error en la verificación');
        setVerified(false);
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
              Verificando...
            </h1>
            <p className="text-slate-400">
              Estamos verificando tu correo institucional
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verified === true) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
              <CheckCircle className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
              ¡Correo Verificado!
            </h1>
            <p className="text-slate-400 mb-6">
              Tu cuenta está lista para usar. Serás redirigido al inicio de sesión...
            </p>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle size={16} />
              <span className="text-sm">Redirigiendo...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verified === false || error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-pink-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
              <AlertCircle className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
              Error de Verificación
            </h1>
            <p className="text-slate-400 mb-6">
              {error || 'No se pudo verificar tu correo'}
            </p>
            <button
              onClick={handleVerification}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Reintentar
            </button>
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-slate-500 text-sm">
                ¿Necesitas ayuda? Contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null; // No debería llegar aquí
}
