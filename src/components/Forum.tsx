import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Plus, Search, Filter, MessageCircle, Clock, LayoutDashboard, Eye, X, User } from 'lucide-react';
import { useAuth } from '../App';
import { cn, apiFetch } from '../lib/utils';

export default function Forum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });
  const [newComment, setNewComment] = useState('');
  
  const [filters, setFilters] = useState({
    q: '',
    author: '',
    category: 'all',
    startDate: '',
    endDate: ''
  });
  const [listPage, setListPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const fetchPosts = async (page = 1, append = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (filters.q) params.append('q', filters.q);
    if (filters.author) params.append('author', filters.author);
    if (filters.category !== 'all') params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const res = await apiFetch(`/api/posts?${params.toString()}`);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : data;
    setPosts((prev) => (append ? [...prev, ...items] : items));
    setListPage(page);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  };

  useEffect(() => {
    setListPage(1);
    const timeoutId = setTimeout(() => fetchPosts(1, false), 300);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handlePostClick = async (post: any) => {
    const res = await apiFetch(`/api/posts/${post._id}`);
    const data = await res.json();
    setSelectedPost(data.post);
    setComments(data.comments);
  };

  const handleCreatePost = async () => {
    setError('');
    const res = await apiFetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    });
    if (res.ok) {
      setIsCreating(false);
      setNewPost({ title: '', content: '', category: 'General' });
      fetchPosts(1, false);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo publicar. Intenta de nuevo.');
    }
  };

  const handleAddComment = async () => {
    setError('');
    const res = await apiFetch(`/api/posts/${selectedPost._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment })
    });
    if (res.ok) {
        setNewComment('');
        const cRes = await apiFetch(`/api/posts/${selectedPost._id}`);
        const cData = await cRes.json();
        setComments(cData.comments);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo enviar el comentario.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">
            Foro <span className="text-blue-500">Comunal</span>
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] leading-loose">
            Espacio abierto para el debate, consultas y <br /> convivencia estudiantil COAR.
          </p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center gap-3 shadow-xl"
        >
          <Plus size={20} /> Nueva Publicación
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                    type="text" 
                    placeholder="Título de la publicación" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-blue-700"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
                <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none"
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                >
                    <option>General</option>
                    <option>Matemática (Bachillerato)</option>
                    <option>Literatura</option>
                    <option>Vida Escolar</option>
                    <option>Consejos ExCOAR</option>
                </select>
            </div>
            <textarea 
                placeholder="Escribe el contenido aquí..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] px-6 py-6 text-sm text-white outline-none focus:ring-2 focus:ring-blue-700 h-40 resize-none"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsCreating(false)} className="px-6 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
              <button 
                onClick={handleCreatePost}
                className="bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20"
              >
                Publicar Ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 bg-slate-950/20 border-b border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
              <button className="text-blue-400 border-b-2 border-blue-700 pb-1">Más recientes</button>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                    "flex items-center gap-2 pb-1 transition-colors",
                    isFilterOpen ? "text-blue-400" : "text-slate-500 hover:text-slate-200"
                )}
              >
                <Filter size={14} /> Filtros Avanzados
              </button>
            </div>
            <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="text" 
                placeholder="Buscar por palabra clave..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-700 text-slate-200" 
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Por Autor</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                        value={filters.author}
                        onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
                    <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                        <option value="all">Todas</option>
                        <option>General</option>
                        <option>Matemática (Bachillerato)</option>
                        <option>Literatura</option>
                        <option>Vida Escolar</option>
                        <option>Consejos ExCOAR</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button 
                        onClick={() => setFilters({ q: '', author: '', category: 'all', startDate: '', endDate: '' })}
                        className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                    >
                        Limpiar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="divide-y divide-slate-800/50">
          {posts.filter(Boolean).map((post) => (
            <div
              key={post._id}
              className="p-8 hover:bg-slate-800/20 transition-all cursor-pointer group"
              onClick={() => handlePostClick(post)}
            >
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                    <User size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{post.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2 font-medium mt-1">
                      Por <span className="text-blue-400/80 font-bold">
                        Anónimo · Promo {post.author?.ingresoColegio || post.author?.añoIngreso || 'Desconocido'}
                      </span> • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="bg-slate-800 text-slate-400 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-slate-700/50">
                  {post.category}
                </span>
              </div>
              <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed mb-6">
                {post.content}
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-slate-500">
                  <Eye size={16} />
                  <span className="text-xs font-bold">{post.views}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                  <MessageCircle size={16} />
                  <span className="text-xs font-bold">{post.views > 0 ? Math.floor(post.views / 2) : 0} comentarios</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {listPage < totalPages && (
          <div className="flex justify-center py-8">
            <button
              type="button"
              disabled={loading}
              onClick={() => fetchPosts(listPage + 1, true)}
              className="px-8 py-3 rounded-2xl border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Cargando…' : 'Cargar más publicaciones'}
            </button>
          </div>
        )}
      </div>

      {/* Selected Post Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
              onClick={() => setSelectedPost(null)}
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-800 bg-slate-950/30">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-2xl border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 shadow-lg">
                            <User size={24} className="text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">{selectedPost.title}</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase">De <span className="text-blue-400">Anónimo · Promo {selectedPost.author?.ingresoColegio || selectedPost.author?.añoIngreso || 'Desconocido'}</span> • {new Date(selectedPost.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedPost(null)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500">
                        <X size={24} />
                    </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar">
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                </div>

                <div className="space-y-8">
                  <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <MessageSquare size={18} className="text-blue-500" /> Respuestas de la comunidad
                  </h4>
                  
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id} className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 flex gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                           <User size={16} className="text-slate-400" />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-white">Anónimo · Promo {comment.author.ingresoColegio || comment.author.añoIngreso || 'Desconocido'}</span>
                                <span className="text-[10px] text-slate-600 italic">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{comment.content}</p>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-slate-800/50 space-y-4">
                    <textarea 
                        placeholder="Añade un comentario constructivo..." 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-white outline-none focus:ring-2 focus:ring-blue-700 h-24 resize-none"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button 
                            onClick={handleAddComment}
                            className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20"
                        >
                            Comentar
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
