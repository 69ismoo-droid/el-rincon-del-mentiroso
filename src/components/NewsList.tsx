import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '../App.tsx';

export default function NewsList() {
    const [news, setNews] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/news')
            .then(res => res.json())
            .then(data => setNews(data));
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-6">
                    <Newspaper size={32} className="text-white" />
                </div>
                <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter">Diario <span className="text-indigo-500">Mural</span></h1>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Información oficial y eventos institucionales.</p>
            </div>

            <div className="space-y-8">
                {news.map((item, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={item._id} 
                        className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex flex-col md:flex-row gap-10 items-center hover:bg-slate-800/40 transition-all group"
                    >
                        <div className="w-full md:w-64 aspect-square bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-800">
                             <img src={`https://picsum.photos/seed/${item._id}/400/400`} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex-1 space-y-6">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                                {item.category}
                            </span>
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-indigo-400 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                                {item.content}
                            </p>
                            <div className="flex justify-between items-center pt-6 border-t border-slate-800/50">
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={14} /> {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                                <button className="text-indigo-400 font-black text-xs uppercase flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                    Leer más <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
