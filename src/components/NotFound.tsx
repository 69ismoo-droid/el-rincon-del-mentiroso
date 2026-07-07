import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full py-12 px-8 glass-effect rounded-[3rem] shadow-2xl text-center border-gradient">
        <p className="text-8xl font-black text-white/10 mb-4">404</p>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4 italic">
          Página no encontrada
        </h1>
        <p className="text-slate-400 text-sm font-medium mb-8">
          La ruta que buscas no existe o fue movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-red-700 text-white py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:from-blue-800 hover:to-red-800 transition-all"
          >
            <Home size={18} /> Ir al inicio
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 bg-slate-800 text-slate-300 py-4 px-6 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={18} /> Volver
          </button>
        </div>
      </div>
    </div>
  );
}
