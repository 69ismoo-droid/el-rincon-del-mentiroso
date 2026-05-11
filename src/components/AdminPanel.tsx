import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Shield, UserX, UserCheck, Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '../App.tsx';
import { cn } from '../lib/utils.ts';

export default function AdminPanel() {
  const { user } = useAuth();

  if (!['admin', 'superadmin'].includes(user?.role)) {
    return <div className="p-20 text-center text-red-500 font-bold uppercase tracking-widest">Acceso Denegado</div>;
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
        <div className="bg-slate-900/50 p-12 rounded-[3.5rem] border border-slate-800 flex justify-between items-center shadow-2xl">
            <div className="space-y-3">
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">Panel de <span className="text-indigo-500">Control</span></h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Gestión administrativa y moderación de la comunidad.</p>
            </div>
            <div className="w-24 h-24 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center border border-indigo-600/20">
                <ShieldAlert size={48} className="text-indigo-500" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
                <Users size={32} className="text-indigo-500" />
                <p className="text-4xl font-black text-white">1,240</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuarios Totales</p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
                <Shield size={32} className="text-green-500" />
                <p className="text-4xl font-black text-white">12</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Moderadores Activos</p>
            </div>
            {/* More stats */}
        </div>
    </div>
  );
}
