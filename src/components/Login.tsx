import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { GraduationCap, ShieldCheck, Globe } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[2rem] shadow-2xl p-10 text-center border border-slate-800"
        >
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-indigo-500/20 shadow-2xl skew-x-3">
            <GraduationCap size={32} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tighter uppercase">Foro <span className="text-indigo-400">COAR</span></h1>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed">La red académica de excelencia más grande del país. Exclusivo para alumnos y egresados COAR.</p>
          
          <div className="space-y-3 mb-10">
            <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl text-xs text-slate-300 text-left border border-slate-700/50">
              <ShieldCheck size={18} className="text-indigo-400 shrink-0" />
              <span>Autenticación segura vía Google Workspace Institucional.</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl text-xs text-slate-300 text-left border border-slate-700/50">
              <Globe size={18} className="text-indigo-400 shrink-0" />
              <span>Conecta con sedes de todo el territorio nacional.</span>
            </div>
          </div>

          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-4 bg-white hover:bg-slate-100 text-slate-900 p-4 rounded-2xl font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Acceder con Google
          </button>
          
          <p className="mt-10 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Acceso Controlado • Sistema Encriptado
          </p>
        </motion.div>
      </div>
    </div>
  );
}
