import React, { useState } from 'react';
import { Mail, Lock, User, Calendar, ArrowRight, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface RegisterData {
  email: string;
  password: string;
  nombreCompleto: string;
  añoIngreso: number;
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [registerData, setRegisterData] = useState<RegisterData>({
    email: '',
    password: '',
    nombreCompleto: '',
    añoIngreso: new Date().getFullYear(),
  });

  const [verificationData, setVerificationData] = useState({
    token: '',
    email: '',
  });

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/verificar-otp?email=${encodeURIComponent(data.email)}`);
      } else {
        setError(data.error || 'Error en el registro');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationData.token,
          email: verificationData.email,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setStep(3);
      } else {
        setError(data.error || 'Error en la verificación');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: verificationData.email,
          nombreCompleto: registerData.nombreCompleto,
          añoIngreso: registerData.añoIngreso,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Redirigir al login
        navigate('/login');
      } else {
        setError(data.error || 'Error al completar perfil');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
          <Mail className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Registro</h1>
        <p className="text-slate-400">Usa tu correo institucional del COAR</p>
      </div>

      <form onSubmit={handleStep1} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Correo Institucional
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="email"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              placeholder="tu.nombre@cusco.coar.edu.pe"
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="password"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
              minLength={6}
            />
          </div>
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
              Registrando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center space-y-4">
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
        
        <p className="text-slate-500 text-sm">
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-md mx-auto text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
        <CheckCircle className="text-white" size={40} />
      </div>
      
      <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">
        Revisa tu Correo
      </h1>
      
      <p className="text-slate-400 mb-8">
        Enviamos un enlace de verificación a:<br />
        <span className="text-indigo-400 font-bold">{verificationData.email}</span>
      </p>

      <div className="glass-effect rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 text-amber-400 mb-3">
          <Clock size={20} />
          <span className="font-bold">El enlace expira en 24 horas</span>
        </div>
        <p className="text-slate-400 text-sm">
          Si no recibes el correo, revisa tu carpeta de spam o correo no deseado.
        </p>
      </div>

      <form onSubmit={handleVerification} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Token de Verificación
          </label>
          <input
            type="text"
            value={verificationData.token}
            onChange={(e) => setVerificationData({ ...verificationData, token: e.target.value })}
            placeholder="Pega el token del correo"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center font-mono text-lg"
            required
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-all hover-lift flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Atrás
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verificando...
              </>
            ) : (
              <>
                Verificar
                <CheckCircle size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
          <User className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">
          Completa tu Perfil
        </h1>
        <p className="text-slate-400">
          Tu identidad estará protegida en el foro
        </p>
      </div>

      <form onSubmit={handleCompleteProfile} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nombre Completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="text"
              value={registerData.nombreCompleto}
              onChange={(e) => setRegisterData({ ...registerData, nombreCompleto: e.target.value })}
              placeholder="Tu nombre completo"
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Año de Ingreso al COAR
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-slate-500" size={20} />
            <input
              type="number"
              value={registerData.añoIngreso}
              onChange={(e) => setRegisterData({ ...registerData, añoIngreso: parseInt(e.target.value) })}
              placeholder="Ej: 2021"
              min="2000"
              max={new Date().getFullYear()}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {/* Mensaje de privacidad */}
        <div className="glass-effect rounded-xl p-4 border border-indigo-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock size={16} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-2">🔒 Tu Privacidad es Protegida</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tu nombre real se usará <strong>solo para verificar tu identidad internamente</strong>. 
                En el foro aparecerás siempre como:
              </p>
              <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-indigo-400 font-bold text-center">
                  Anónimo · Ingreso {registerData.añoIngreso}
                </p>
              </div>
            </div>
          </div>
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
              Completar Registro
              <CheckCircle size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-effect rounded-3xl shadow-2xl border-gradient overflow-hidden">
          <div className="p-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      s <= step
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {s < step ? <CheckCircle size={16} /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-full h-1 mx-2 transition-all ${
                        s < step ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>
        </div>
      </div>
    </div>
  );
}
