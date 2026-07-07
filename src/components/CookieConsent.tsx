import React, { useState, useEffect } from 'react';
import { Cookie, X, CheckCircle } from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    onAccept();
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    onReject();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto glass-effect rounded-2xl shadow-2xl border-gradient p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Cookie size={24} className="text-blue-400" />
              <h3 className="text-lg font-bold text-white">Usamos Cookies</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Utilizamos cookies esenciales para mantener tu sesión y el funcionamiento de la plataforma.
              No usamos cookies de publicidad ni rastreo de terceros.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-slate-300 text-sm">Cookies de sesión: necesarias para iniciar sesión</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleReject}
              className="px-6 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-all hover-lift"
            >
              Rechazar
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-3 bg-gradient-to-r from-blue-700 to-red-700 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient"
            >
              Aceptar
            </button>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4 text-xs text-slate-400">
            <a 
              href="/terminos" 
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              Términos y Condiciones
            </a>
            <a 
              href="/privacidad" 
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              Política de Privacidad
            </a>
            <a 
              href="/cookies" 
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              Política de Cookies
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
