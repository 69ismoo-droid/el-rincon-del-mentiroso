import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Newspaper, Calendar, ArrowRight, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../App';
import { apiFetch } from '../lib/utils';

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export default function NewsList() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNews, setShowAddNews] = useState(false);
  const [newNews, setNewNews] = useState({ title: '', content: '', category: 'ACADEMICO' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNews = async () => {
    try {
      setAdding(true);
      const res = await apiFetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNews),
      });
      if (res.ok) {
        setShowAddNews(false);
        setNewNews({ title: '', content: '', category: 'ACADEMICO' });
        loadNews();
      }
    } catch (error) {
      console.error('Error adding news:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('¿Eliminar esta noticia?')) return;
    try {
      const res = await apiFetch(`/api/news/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadNews();
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <Newspaper size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-6xl font-black text-white italic uppercase tracking-tighter">
              Diario <span className="text-indigo-500">Mural</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mt-2">
              Información oficial y eventos institucionales.
            </p>
          </div>
        </div>
        {["admin", "superadmin"].includes(user?.role) && (
          <button
            onClick={() => setShowAddNews(true)}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            <Plus size={18} />
            Agregar Noticia
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddNews && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                Agregar Nueva Noticia
              </h3>
              <button
                onClick={() => setShowAddNews(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newNews.title}
                  onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                  placeholder="Título de la noticia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Categoría
                </label>
                <select
                  value={newNews.category}
                  onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none"
                >
                  <option value="ACADEMICO">Académico</option>
                  <option value="EVENTOS">Eventos</option>
                  <option value="DEPORTES">Deportes</option>
                  <option value="INSTITUCIONAL">Institucional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contenido
                </label>
                <textarea
                  value={newNews.content}
                  onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                  placeholder="Escribe el contenido de la noticia..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-48"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAddNews(false)}
                className="px-6 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNews}
                disabled={adding}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {adding ? "Publicando..." : "Publicar Noticia"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
            Cargando noticias...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {news.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={64} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-bold">Aún no hay noticias</p>
            </div>
          ) : (
            news.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={item._id}
                className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex flex-col md:flex-row gap-10 items-center hover:bg-slate-800/40 transition-all group"
              >
                <div className="w-full md:w-64 aspect-square bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-800">
                  <img
                    src={`https://picsum.photos/seed/${item._id}/400/400`}
                    alt=""
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                      {item.category}
                    </span>
                    {["admin", "superadmin"].includes(user?.role) && (
                      <button
                        onClick={() => handleDeleteNews(item._id)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-xl"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
