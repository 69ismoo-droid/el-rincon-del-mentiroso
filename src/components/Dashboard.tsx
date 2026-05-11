import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  MessageSquare, 
  Trophy, 
  Newspaper,
  PlusCircle,
  ArrowRight,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils.ts';

export default function Dashboard() {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    // Fetch some dashboard data
    fetch('/api/news').then(r => r.json()).then(data => setNews(data.slice(0, 3)));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-screen">
      {/* Featured News / Welcome Banner (Bento Piece 1) */}
      <section className="col-span-1 md:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 p-8 flex flex-col justify-end relative overflow-hidden group shadow-2xl min-h-[400px]">
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded">COMUNICADO OFICIAL</span>
            <span className="text-emerald-400 text-[10px] font-mono tracking-tighter uppercase font-bold animate-pulse">Live Update</span>
        </div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">¡Bienvenido a la evolución del Foro <span className="text-indigo-400">COAR</span>!</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl">
            La plataforma líder para conectar a la excelencia académica del país. Explora noticias, califica docentes y participa en la comunidad.
          </p>
          <div className="flex gap-4">
            <Link to="/foro" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2">
              <PlusCircle size={20} /> Nuevo Hilo
            </Link>
            <Link to="/noticias" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-bold transition-all border border-slate-700">
              Ver Noticias
            </Link>
          </div>
        </div>
        
        {/* Background Effect */}
        <div className="absolute right-[-10%] bottom-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
          <GraduationCap size={400} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
      </section>

      {/* Quick Stats (Bento Piece 2) */}
      <section className="col-span-1 md:col-span-4 grid grid-cols-2 gap-4">
        {[
          { label: 'Hilos', value: '1.2k', icon: MessageSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Docentes', value: '450', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Apuestas', value: '12k', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Comunidad', value: '8.4k', icon: Newspaper, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map((stat, i) => (
          <div key={stat.label} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/30 transition-all cursor-pointer shadow-lg">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* News Portal (Bento Piece 3) */}
      <section className="col-span-1 md:col-span-12 lg:col-span-8 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col min-h-[500px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Newspaper className="text-indigo-400" size={24} /> 
                Portal de Noticias
            </h3>
            <p className="text-xs text-slate-500">Actualizaciones oficiales de Secretaría COAR</p>
          </div>
          <Link to="/noticias" className="text-indigo-400 text-xs font-bold uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1 group">
            Explorar todas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {news.length > 0 ? news.map((item, i) => (
            <div key={item._id} className={cn(
                "p-6 rounded-2xl border border-slate-800 hover:bg-slate-800/30 transition-all group flex flex-col",
                i === 0 && "md:col-span-2 bg-indigo-500/5 border-indigo-500/20"
            )}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                <span className="p-1 px-2 rounded bg-slate-800 text-[8px] font-bold text-slate-500">COMUNICADO</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">{item.title}</h4>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">{item.content}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={item.author.picture || "https://ui-avatars.com/api/?name=Admin"} className="w-5 h-5 rounded-full" alt="" />
                    <span className="text-[10px] text-slate-500">{item.author.name}</span>
                </div>
                <button className="text-[10px] font-bold text-white flex items-center gap-1">LEER MÁS <ArrowRight size={10} /></button>
              </div>
            </div>
          )) : (
            <div className="col-span-2 flex flex-col items-center justify-center p-20 text-slate-600">
                <Newspaper size={48} className="mb-4 opacity-10" />
                <p className="text-sm">No hay noticias oficiales publicadas.</p>
            </div>
          )}
        </div>
      </section>

      {/* Betting / Activity (Bento Piece 4) */}
      <section className="col-span-1 md:col-span-6 lg:col-span-4 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <span className="text-yellow-500 font-bold">⚡</span> Eventos Activos
            </h3>
        </div>
        <div className="p-6 flex-1 space-y-4">
            {[
                { title: 'Final Voley: Lima vs Cusco', pool: '45k pts', odds: 'x1.8' },
                { title: 'Elecciones Municipio 2024', pool: '12k pts', odds: 'x2.5' }
            ].map(bet => (
                <div key={bet.title} className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-all cursor-pointer group">
                    <p className="text-xs font-bold text-white mb-1">{bet.title}</p>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">Bota: {bet.pool}</span>
                        <span className="text-indigo-400 font-mono font-bold text-sm">{bet.odds}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <button className="flex-1 py-1.5 bg-indigo-600 rounded-lg text-[10px] font-bold text-white">APOSTAR</button>
                    </div>
                </div>
            ))}
            <Link to="/apuestas" className="block text-center text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest mt-4">Ver todos los eventos</Link>
        </div>
      </section>

      {/* Lost Items (Bento Piece 5) */}
      <section className="col-span-1 md:col-span-6 lg:col-span-12 bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    Objetos Perdidos
                </h3>
                <p className="text-xs text-slate-500">Recupera tus pertenencias en el campus</p>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perdido</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Encontrado</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={cn(
                    "p-5 rounded-2xl border bg-slate-950/20 cursor-pointer hover:bg-slate-800/40 transition-all",
                    i % 2 === 0 ? "border-red-500/20 border-l-4 border-l-red-500" : "border-emerald-500/20 border-l-4 border-l-emerald-500"
                )}>
                    <p className="font-bold text-white text-sm mb-2">Calculadora TI {i}</p>
                    <p className="text-[10px] text-slate-500 mb-4 flex items-center gap-1">
                        <MapPin size={10} /> Aula {300 + i} • Hoy
                    </p>
                    <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300">Contactar</button>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}

