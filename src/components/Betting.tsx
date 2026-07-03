import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Coins, History, TrendingUp, Plus, X } from 'lucide-react';
import { useAuth } from '../App';
import { apiFetch } from '../lib/utils';

export default function Betting() {
  const { user, refresh } = useAuth();
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBet, setShowCreateBet] = useState(false);

  useEffect(() => {
    loadBets();
  }, []);

  const loadBets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/bets');
      const data = await res.json();
      setBets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading bets:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white p-10 rounded-[2rem] relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-yellow-500 mb-6">
              <Trophy size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Official COAR Betting Station</span>
            </div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase leading-none">Betting <span className="text-indigo-400">House</span></h2>
            <p className="text-slate-400 text-lg leading-relaxed">Multiplica tus Créditos COAR. Apuesta en eventos deportivos, olimpiadas y concursos de talentos.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-slate-950/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 text-center min-w-[240px] shadow-2xl">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Balance Disponible</p>
              <div className="flex items-center justify-center gap-3 text-4xl font-black text-yellow-500">
                <Coins size={32} /> {user?.credits?.toLocaleString() || 0}
              </div>
            </div>
            {["admin", "superadmin"].includes(user?.role) && (
              <button
                onClick={() => setShowCreateBet(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:from-yellow-700 hover:to-orange-700 transition-all"
              >
                <Plus size={18} />
                Crear Apuesta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-3 text-white">
            <TrendingUp size={24} className="text-indigo-400" /> Eventos en Vivo & Próximos
          </h3>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Cargando apuestas...</p>
              </div>
            ) : bets.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-3xl border border-slate-800">
                <Trophy size={64} className="text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Aún no hay apuestas activas</p>
                {["admin", "superadmin"].includes(user?.role) && (
                  <button
                    onClick={() => setShowCreateBet(true)}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:from-yellow-700 hover:to-orange-700 transition-all"
                  >
                    <Plus size={18} className="inline mr-2" />
                    Crear Primera Apuesta
                  </button>
                )}
              </div>
            ) : (
              bets.map((bet) => (
                <div key={bet._id} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-indigo-500/30 transition-all group shadow-xl">
                  <div className="flex gap-6 items-center">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-white group-hover:text-indigo-400 transition-colors">{bet.event}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {new Date(bet.createdAt).toLocaleDateString()} • <span className="text-green-400">{(bet.status || "open").toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-3 text-white">
            <History size={24} className="text-slate-500" /> Mi Historial
          </h3>
          <div className="bg-slate-900 rounded-3xl border border-slate-800 divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto shadow-2xl">
            <div className="p-20 text-center text-slate-600 flex flex-col items-center">
              <History size={40} className="mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Sin actividad reciente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear apuesta (solo admins) */}
      <AnimatePresence>
        {showCreateBet && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-slate-800 relative"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Crear <span className="text-yellow-500">Apuesta</span></h3>
                <button onClick={() => setShowCreateBet(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); setShowCreateBet(false); }} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre del Evento</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Final Intercolegial de Fútbol" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-yellow-500 transition-all placeholder:text-slate-700"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowCreateBet(false)} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest text-xs">Cancelar</button>
                  <button type="submit" className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:from-yellow-700 hover:to-orange-700 transition-all active:scale-95">Crear Apuesta</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
