import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Plus, ThumbsUp, Trophy } from 'lucide-react';
import { useAuth } from '../App.tsx';
import { cn } from '../lib/utils.ts';

export default function TeacherRanking() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teacher-ratings')
      .then(res => res.json())
      .then(data => {
        setTeachers(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <div className="bg-slate-900/50 p-12 rounded-[3.5rem] border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Ranking de <span className="text-yellow-500">Excelencia</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs leading-loose">Reconocimiento a la labor docente COAR basada <br /> en el feedback constructivo de los estudiantes.</p>
        </div>
        <div className="w-24 h-24 bg-yellow-500/10 rounded-[2.5rem] flex items-center justify-center border border-yellow-500/20 shadow-2xl shadow-yellow-500/20">
           <Trophy size={48} className="text-yellow-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teachers.map((teacher, idx) => (
          <motion.div 
            key={teacher._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:bg-slate-800/40 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center font-black text-2xl text-white italic">
                    {teacher.name.charAt(0)}
                </div>
                <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                    <Star size={14} className="fill-yellow-500 text-yellow-500" />
                    <span className="text-xs font-black text-yellow-500">{teacher.rating.toFixed(1)}</span>
                </div>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{teacher.name}</h3>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">{teacher.subject}</p>
            
            <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase">42 reseñas</span>
                <button className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-800 px-4 py-2 rounded-xl group-hover:bg-indigo-600 transition-all">Ver Perfil</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
