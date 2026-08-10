import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Sparkles, Shield } from 'lucide-react';
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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="glass-effect rounded-[2rem] shadow-2xl border-gradient overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Columna Izquierda - Formulario de Login */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
            {/* Logo/Brand */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-700 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="text-white" size={24} />
                </div>
                <span className="text-2xl font-black text-white tracking-tighter">COAR</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mb-2">
                Bienvenido de nuevo
              </h1>
              <p className="text-slate-400 text-sm md:text-base">
                Accede a tu cuenta para continuar con la comunidad
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-blue-400 transition-colors">
                  Correo Institucional
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tu.nombre@cusco.coar.edu.pe"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-800/50 backdrop-blur-sm border-2 rounded-2xl text-white placeholder-slate-500 focus:outline-none transition-all duration-300 ${
                      fieldErrors.email
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  />
                </div>
                {fieldErrors.email && <p className="text-red-400 text-xs mt-2 ml-1">{fieldErrors.email}</p>}
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 group-focus-within:text-blue-400 transition-colors">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Tu contraseña"
                    className={`w-full pl-12 pr-12 py-4 bg-slate-800/50 backdrop-blur-sm border-2 rounded-2xl text-white placeholder-slate-500 focus:outline-none transition-all duration-300 ${
                      fieldErrors.password
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-700/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 hover:bg-slate-700/50 rounded-xl"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-400 text-xs mt-2 ml-1">{fieldErrors.password}</p>}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-red-700 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:from-blue-800 hover:to-red-800 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
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

            {/* Footer Links */}
            <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500">
              <Link to="/terminos" className="hover:text-slate-300 transition-colors">
                Términos
              </Link>
              <span className="text-slate-700">·</span>
              <Link to="/privacidad" className="hover:text-slate-300 transition-colors">
                Privacidad
              </Link>
              <span className="text-slate-700">·</span>
              <Link to="/cookies" className="hover:text-slate-300 transition-colors">
                Cookies
              </Link>
            </div>
          </div>

          {/* Columna Derecha - Panel Lateral CTA */}
          <div className="md:w-[400px] bg-gradient-to-br from-blue-900/50 to-red-900/50 backdrop-blur-xl border-l border-slate-700/50 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-blue-400" size={24} />
                <span className="text-blue-400 font-bold text-sm uppercase tracking-wider">
                  Únete a la comunidad
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-4">
                ¿No tienes cuenta?
              </h2>

              <p className="text-slate-300 mb-8 text-sm md:text-base leading-relaxed">
                Regístrate ahora y forma parte de la comunidad anónima más grande del COAR. Comparte, interactúa y conecta de forma segura.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Shield className="text-blue-400" size={16} />
                  </div>
                  <span>100% anónimo y seguro</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-red-400" size={16} />
                  </div>
                  <span>Comunidad activa</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Crear Cuenta
                <ArrowRight size={20} />
              </button>

              <p className="text-slate-500 text-xs mt-6 text-center">
                ¿Olvidaste tu contraseña? Contacta a un administrador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
