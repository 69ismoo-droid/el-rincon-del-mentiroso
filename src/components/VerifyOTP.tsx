import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { otpCodeSchema, type OtpCodeFormData } from '../lib/validation';

export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof OtpCodeFormData, string>>>({});
  const [resending, setResending] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);

  const emailFromParams = searchParams.get('email') || '';
  const [emailInput, setEmailInput] = useState(emailFromParams);

  const [formData, setFormData] = useState<OtpCodeFormData>({
    code: '',
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailInput) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    // Validar con Zod
    const validationResult = otpCodeSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors: Partial<Record<keyof OtpCodeFormData, string>> = {};
      validationResult.error.issues.forEach((issue: any) => {
        if (issue.path[0]) {
          errors[issue.path[0] as keyof OtpCodeFormData] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          email: emailInput,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setVerified(true);
        setTimeout(() => {
          if (data.needsProfile) {
            navigate('/complete-profile', { state: { email: emailInput } });
          } else {
            navigate('/login');
          }
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

  const handleResendOTP = async () => {
    if (!emailInput) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    setResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailInput,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setError('');
        setRemainingAttempts(data.remainingAttempts || 3);
        setBlockedUntil(null);
        alert('Nuevo código enviado a tu correo. Revisa tu bandeja de entrada.');
      } else if (response.status === 429) {
        setError(data.error || 'Has excedido el límite de reenvíos');
        if (data.blockedUntil) {
          setBlockedUntil(new Date(data.blockedUntil));
        }
      } else {
        setError(data.error || 'Error al reenviar el código');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setResending(false);
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
              Estamos verificando tu código
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
              ¡Código Verificado!
            </h1>
            <p className="text-slate-400 mb-6">
              Tu cuenta está verificada. Serás redirigido para completar tu perfil...
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
            <button
              onClick={() => navigate('/register')}
              className="text-slate-400 hover:text-white transition-colors mb-6 flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Volver
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 border-gradient">
                <Mail className="text-white" size={40} />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">
                Verificar Cuenta
              </h1>
              <p className="text-slate-400">
                Ingresa tu correo y el código de verificación
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="tu.nombre@cusco.coar.edu.pe"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Código de Verificación
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="123456"
                  maxLength={6}
                  className={`w-full px-4 py-4 bg-slate-800 border rounded-xl text-white text-center text-2xl font-bold tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.code ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-indigo-500 focus:border-transparent'
                  }`}
                  required
                />
                {fieldErrors.code && <p className="text-red-400 text-xs mt-1">{fieldErrors.code}</p>}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              {blockedUntil ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-400 text-sm font-medium flex items-center justify-center gap-2">
                    <AlertCircle size={16} />
                    Bloqueado temporalmente
                  </p>
                  <p className="text-amber-300 text-xs mt-2">
                    Intenta nuevamente después de las {blockedUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-slate-500 text-sm">
                    ¿No recibiste el código?{' '}
                    <button
                      onClick={handleResendOTP}
                      disabled={resending}
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                      {resending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          Reenviando...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Reenviar código
                        </>
                      )}
                    </button>
                  </p>
                  {remainingAttempts < 3 && (
                    <p className="text-amber-400 text-xs">
                      {remainingAttempts} intentos restantes
                    </p>
                  )}
                </>
              )}
              <p className="text-slate-600 text-xs">
                ¿Te equivocaste de correo?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Volver al registro
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
