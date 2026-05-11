import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Coins, History, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../App.tsx';

export default function Betting() {
  const { user, refresh } = useAuth();
  const [bets, setBets] = useState<any[]>([]);
  const [isBetting, setIsBetting] = useState(false);
  const [newBet, setNewBet] = useState({ event: 'Final Intercolegial Futbol', amount: 50, prediction: '' });

  const fetchBets = async () => {
    const res = await fetch('/api/bets');
    const data = await res.json();
    setBets(data);
  };

  useEffect(() => {
    fetchBets();
  }, []);

  const handleBet = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBet)
    });
    if (res.ok) {
      setIsBetting(false);
      setNewBet({ event: 'Final Intercolegial Futbol', amount: 50, prediction: '' });
      fetchBets();
      refresh();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-900 text-white p-10 rounded-[2rem] relative overflow-hidden shadow-2xl border border-slate-800 group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-yellow-500 mb-6">
              <Trophy size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Official COAR Betting Station</span>
            </div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter uppercase leading-none">Betting <span className="text-indigo-400">House</span></h2>
            <p className="text-slate-400 text-lg leading-relaxed">Multiplica tus Créditos COAR. Apuesta en eventos deportivos, olimpiadas y concursos de talentos.</p>
          </div>
          
          <div className="bg-slate-950/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 text-center min-w-[240px] shadow-2xl">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Balance Disponible</p>
            <div className="flex items-center justify-center gap-3 text-4xl font-black text-yellow-500">
              <Coins size={32} /> {user?.credits?.toLocaleString() || 0}
            </div>
            <div className="mt-6 flex flex-col gap-1 items-center">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">+20 PTS DAILY LOGIN</span>
                <div className="w-12 h-1 bg-emerald-500/20 rounded-full overflow-hidden mt-1">
                    <div className="w-full h-full bg-emerald-500"></div>
                </div>
            </div>
          </div>
        </div>
        <div className="absolute right-[-5%] bottom-[-20%] opacity-5 group-hover:opacity-10 transition-opacity duration-700">
           <Trophy size={400} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-3 text-white">
            <TrendingUp size={24} className="text-indigo-400" /> Eventos en Vivo & Próximos
          </h3>
          
          <div className="space-y-4">
            {[
              { id: 1, title: 'Final Fútbol: 5to A vs 5to B', date: 'Viernes 15 Mayo', odds: 'x1.8 / x2.5', status: 'HOT' },
              { id: 2, title: 'Competencia Murales COAR', date: 'Lunes 18 Mayo', odds: 'x1.2 / x3.0', status: 'UPCOMING' },
              { id: 3, title: 'Elección Municipio Escolar', date: '25 Mayo', odds: 'x1.5 / x1.5', status: 'UPCOMING' }
            ].map(event => (
              <div key={event.id} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-indigo-500/30 transition-all group shadow-xl">
                <div className="flex gap-6 items-center">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all text-indigo-400 shadow-inner">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-white group-hover:text-indigo-400 transition-colors">{event.title}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{event.date} • <span className="text-indigo-400">{event.status}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Cuotas Est.</p>
                    <p className="font-mono font-bold text-lg text-emerald-400">{event.odds}</p>
                  </div>
                  <button 
                    onClick={() => { setIsBetting(true); setNewBet({ ...newBet, event: event.title }); }}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                  >
                    Apostar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-3 text-white">
            <History size={24} className="text-slate-500" /> Mi Historial
          </h3>
          <div className="bg-slate-900 rounded-3xl border border-slate-800 divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto shadow-2xl">
            {bets.map(bet => (
              <div key={bet._id} className="p-6 hover:bg-slate-800/20 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-bold text-white line-clamp-1">{bet.event}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                    bet.outcome === 'won' ? 'bg-emerald-500/10 text-emerald-400' : 
                    bet.outcome === 'lost' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {bet.outcome || 'Pendiente'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Pred: {bet.prediction}</p>
                  <p className="text-sm font-bold flex items-center gap-1 text-white">-{bet.amount} <Coins size={14} className="text-yellow-500" /></p>
                </div>
              </div>
            ))}
            {bets.length === 0 && (
              <div className="p-20 text-center text-slate-600 flex flex-col items-center">
                 <History size={40} className="mb-4 opacity-20" />
                 <p className="text-xs font-bold uppercase tracking-widest">Sin actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isBetting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl border border-slate-800 relative"
          >
            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Realizar <span className="text-indigo-400">Apuesta</span></h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-8">{newBet.event}</p>
            
            <form onSubmit={handleBet} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Tu Predicción Técnica</label>
                <input 
                  type="text" placeholder="Ej: Lima gana por 3-0 en sets" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                  value={newBet.prediction} onChange={(e) => setNewBet({ ...newBet, prediction: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 flex justify-between">
                  Monto de Inversión <span className="text-indigo-400">Límite: {user?.credits} PTS</span>
                </label>
                <div className="flex items-center gap-6 p-6 bg-slate-950 border border-slate-800 rounded-2xl">
                  <input 
                    type="range" min="10" max={user?.credits} step="10"
                    className="flex-1 accent-indigo-500 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer"
                    value={newBet.amount} onChange={(e) => setNewBet({ ...newBet, amount: parseInt(e.target.value) })}
                  />
                  <div className="text-2xl font-black text-white w-24 text-right">
                    {newBet.amount}
                  </div>
                </div>
              </div>

              <div className="flex bg-indigo-500/5 p-6 rounded-2xl items-center gap-6 border border-indigo-500/10">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <ArrowUpRight size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Retorno Proyectado</p>
                    <p className="text-2xl font-black text-white">{(newBet.amount * 2.5).toLocaleString()} <span className="text-sm font-bold text-slate-500">PTS</span></p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsBetting(false)} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" className="flex-1 bg-white text-slate-950 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-100 transition-all active:scale-95">Confirmar Apuesta</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
