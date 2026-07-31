import React from 'react';
import { useAuth } from '../App';
import { Bell, Clock, Trash2, CheckCircle, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function NotificationsList() {
  const { notifications, markAsRead } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 italic">Centro de <span className="text-blue-400">Notificaciones</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Gestión centralizada de actividad e interacciones</p>
        </div>
        <button 
          onClick={markAsRead}
          className="bg-blue-700/10 text-blue-400 border border-blue-600/20 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600/20 transition-all flex items-center gap-2"
        >
          <CheckCircle size={16} /> Marcar todo como leído
        </button>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
        <div className="divide-y divide-slate-800/50">
          {notifications.length > 0 ? (
            notifications.map((notif: any, index: number) => (
              <motion.div 
                key={notif._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-8 flex gap-6 items-start hover:bg-slate-800/30 transition-all group",
                  !notif.read && "bg-blue-600/5 border-l-4 border-l-blue-600"
                )}
              >
                <div className="w-14 h-14 rounded-2xl border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                  <User size={24} className="text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                      {notif.content}
                    </p>
                    <span className="text-[10px] bg-slate-800 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-[0.2em]">
                      {notif.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-xs text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
                      <Clock size={14} className="text-slate-700" /> {new Date(notif.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-600 font-medium">De: {notif.sender.name}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-32 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-slate-800 flex items-center justify-center mb-8 opacity-20">
                <Bell size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 uppercase tracking-widest">Bandeja Vacía</h3>
              <p className="text-slate-800 text-sm mt-2 max-w-xs mx-auto">No hay notificaciones pendientes. Vuelve más tarde para ver nuevas interacciones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
