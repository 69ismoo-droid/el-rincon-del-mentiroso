import React, { useState, useEffect } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import { useAuth } from '../App';

interface AnioIngresoFormProps {
  onClose: () => void;
}

export default function AnioIngresoForm({ onClose }: AnioIngresoFormProps) {
  const { user, refresh } = useAuth();
  const [anio, setAnio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.ingresoColegio) {
      setAnio(user.ingresoColegio.toString());
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!anio || isNaN(Number(anio)) || Number(anio) < 2000 || Number(anio) > new Date().getFullYear()) {
      setError('Por favor ingresa un año válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/ingreso-colegio', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingresoColegio: Number(anio) }),
        credentials: 'include',
      });

      if (response.ok) {
        await refresh();
        onClose();
      } else {
        setError('Error al actualizar el año de ingreso');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative glass-effect rounded-3xl shadow-2xl border-gradient max-w-md w-full mx-auto overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-indigo-400" size={24} />
              <h2 className="text-xl font-bold text-white">Año de Ingreso al Colegio</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ¿En qué año ingresaste al colegio?
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  placeholder="Ej: 2021"
                  min="2000"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <Calendar className="absolute right-3 top-3.5 text-slate-500" size={20} />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-all hover-lift"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Año
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Este dato ayuda a contextualizar las publicaciones en el foro. 
            Solo tú y los administradores pueden ver tu año real.
          </p>
        </div>
      </div>
    </div>
  );
}
