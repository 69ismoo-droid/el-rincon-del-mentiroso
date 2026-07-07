import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, MapPin, Calendar, Tag, Package, HelpCircle } from 'lucide-react';
import { useAuth } from '../App';
import { cn, apiFetch } from '../lib/utils';

export default function LostFound() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/lost-found')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-12 rounded-[3.5rem] border border-slate-800 gap-8">
            <div>
                <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">Objetos <span className="text-red-500">Perdidos</span></h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Módulo de recuperación de pertenencias en el campus.</p>
            </div>
            <button className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-2xl">
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
    </div>
  );
}
