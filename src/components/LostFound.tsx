import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, MapPin, Calendar, Tag, Package, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../App';
import { cn, apiFetch } from '../lib/utils';

export default function LostFound() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ title: '', description: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/lost-found')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.description || !reportForm.location) {
      setError('Todos los campos son requeridos');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await apiFetch('/api/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm),
      });

      if (res.ok) {
        setShowReportModal(false);
        setReportForm({ title: '', description: '', location: '' });
        // Reload items
        const data = await apiFetch('/api/lost-found').then(r => r.json());
        setItems(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al reportar hallazgo');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-12 rounded-[3.5rem] border border-slate-800 gap-8">
            <div>
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">Objetos <span className="text-red-500">Perdidos</span></h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Módulo de recuperación de pertenencias en el campus.</p>
            </div>
            <button
                onClick={() => setShowReportModal(true)}
                className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-2xl"
            >
                <Plus size={18} className="inline mr-2" />
                Reportar Hallazgo
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
                <div key={item._id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl hover:scale-[1.02] transition-all group">
                    <div className="aspect-video bg-slate-800 relative">
                        {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-700">
                                <Package size={64} />
                            </div>
                        )}
                        <span className={cn(
                            "absolute top-4 right-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                            item.status === 'lost' ? "bg-red-500 text-white" : "bg-green-500 text-white"
                        )}>
                            {item.status}
                        </span>
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">{item.title}</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-slate-500">
                                <MapPin size={16} className="text-blue-600" />
                                <span className="text-xs font-bold uppercase">{item.location}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <Calendar size={16} className="text-blue-600" />
                                <span className="text-xs font-bold uppercase">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Modal de Reportar Hallazgo */}
        <AnimatePresence>
            {showReportModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-slate-800 relative"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Reportar <span className="text-red-500">Hallazgo</span></h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleReportSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Título del objeto</label>
                                <input
                                    type="text"
                                    value={reportForm.title}
                                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                                    placeholder="Ej: Celular Samsung"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-700"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Descripción</label>
                                <textarea
                                    value={reportForm.description}
                                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                    placeholder="Describe el objeto encontrado..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-700 resize-none h-32"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Ubicación</label>
                                <input
                                    type="text"
                                    value={reportForm.location}
                                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                                    placeholder="Ej: Sala de estudio 3"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-700"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm font-bold">{error}</p>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:from-red-700 hover:to-orange-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? 'Reportando...' : 'Reportar Hallazgo'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
}
