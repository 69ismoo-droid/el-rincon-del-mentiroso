import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Calendar, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { completeProfileSchema, type CompleteProfileFormData } from '../lib/validation';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CompleteProfileFormData, string>>>({});

  const email = location.state?.email || '';

  const [formData, setFormData] = useState<CompleteProfileFormData>({
    email: email,
    nombreCompleto: '',
    añoIngreso: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!email) {
      setError('Email no proporcionado. Por favor regístrate nuevamente.');
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar con Zod
    const validationResult = completeProfileSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors: Partial<Record<keyof CompleteProfileFormData, string>> = {};
      validationResult.error.issues.forEach((issue: any) => {
        if (issue.path[0]) {
          errors[issue.path[0] as keyof CompleteProfileFormData] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Error al completar perfil');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-pink-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
              <AlertCircle className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
              Error
            </h1>
            <p className="text-slate-400 mb-6">
              Email no proporcionado. Por favor regístrate nuevamente.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient"
            >
              Ir al Registro
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
              <CheckCircle className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">
              ¡Perfil Completado!
            </h1>
            <p className="text-slate-400 mb-6">
              Tu cuenta está lista. Serás redirigido al inicio de sesión...
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

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
                <User className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">
                Completa tu Perfil
              </h1>
              <p className="text-slate-400">
                Ingresa tus datos para finalizar el registro
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo Institucional
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                  placeholder="Juan Pérez"
                  className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.nombreCompleto ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-indigo-500 focus:border-transparent'
                  }`}
                  required
                />
                {fieldErrors.nombreCompleto && <p className="text-red-400 text-xs mt-1">{fieldErrors.nombreCompleto}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Año de Ingreso al COAR
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 text-slate-500" size={20} />
                  <input
                    type="number"
                    value={formData.añoIngreso}
                    onChange={(e) => setFormData({ ...formData, añoIngreso: parseInt(e.target.value) })}
                    placeholder="2024"
                    min="2000"
                    max={new Date().getFullYear()}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.añoIngreso ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-indigo-500 focus:border-transparent'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.añoIngreso && <p className="text-red-400 text-xs mt-1">{fieldErrors.añoIngreso}</p>}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    Completar Perfil
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500 text-sm">
                Tu nombre real solo se usará para verificar tu identidad internamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
