import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { loginSchema, type LoginFormData } from '../lib/validation';
import { apiFetch } from '../lib/utils';
import { useAuth } from '../App';

export default function LoginNew() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar con Zod
    const validationResult = loginSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors: Partial<Record<keyof LoginFormData, string>> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as keyof LoginFormData] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await refresh();
        navigate('/', { replace: true });
      } else {
        if (data.needsVerification) {
          setError('Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.');
        } else {
          setError(data.error || 'Error en el inicio de sesión');
        }
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-700 to-red-700 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
                <User className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">
                Inicio de Sesión
              </h1>
              <p className="text-slate-400">
                Accede a la comunidad anónima del COAR
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo Institucional
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-500" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu.nombre@cusco.coar.edu.pe"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-blue-700 focus:border-transparent'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Tu contraseña"
                    className={`w-full pl-12 pr-12 py-3 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-blue-700 focus:border-transparent'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-red-700 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:from-blue-800 hover:to-red-800 transition-all hover-lift border-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Lock size={16} />
                <span>Foro 100% anónimo y seguro</span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 text-xs">
                <Link to="/terminos" className="text-slate-500 hover:text-slate-300 transition-colors">
                  Términos y Condiciones
                </Link>
                <span className="text-slate-700">·</span>
                <Link to="/privacidad" className="text-slate-500 hover:text-slate-300 transition-colors">
                  Política de Privacidad
                </Link>
                <span className="text-slate-700">·</span>
                <Link to="/cookies" className="text-slate-500 hover:text-slate-300 transition-colors">
                  Política de Cookies
                </Link>
              </div>
              
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <p className="text-slate-500 text-sm">
                  ¿Olvidaste tu contraseña?{' '}
                  <span className="text-slate-400">
                    Contacta a un administrador del foro para restablecerla.
                  </span>
                </p>
                <p className="text-slate-500 text-sm">
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
