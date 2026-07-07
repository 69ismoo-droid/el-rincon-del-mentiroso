import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, Plus, Search, X } from 'lucide-react';
import { useAuth } from '../App';
import { cn, apiFetch, isAdminRole } from '../lib/utils';
import { Link } from 'react-router-dom';

interface Teacher {
  _id: string;
  name: string;
  subject: string;
  rating: number;
  reviews: any[];
}

export default function TeacherRanking() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', subject: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    try {
      setAdding(true);
      const res = await apiFetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeacher),
      });
      if (res.ok) {
        setShowAddTeacher(false);
        setNewTeacher({ name: '', subject: '' });
        loadTeachers();
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <div className="bg-slate-900/50 p-12 rounded-[3.5rem] border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">
            Ranking de <span className="text-yellow-800">Excelencia</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs leading-loose">
            Reconocimiento a la labor docente COAR basada <br /> en el feedback constructivo de los estudiantes.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="w-24 h-24 bg-yellow-800/10 rounded-[2.5rem] flex items-center justify-center border border-yellow-800/20 shadow-2xl shadow-yellow-800/20">
            <Trophy size={48} className="text-yellow-800" />
          </div>
          {isAdminRole(user?.role) && (
            <button
              onClick={() => setShowAddTeacher(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-900 to-orange-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:from-yellow-700 hover:to-orange-700 transition-all"
            >
              <Plus size={18} />
              Agregar Profesor
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddTeacher && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                Agregar Nuevo Profesor
              </h3>
              <button
                onClick={() => setShowAddTeacher(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Profesor
                </label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="Prof. Juan Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Materia
                </label>
                <input
                  type="text"
                  value={newTeacher.subject}
                  onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                  placeholder="Matemáticas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-800"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowAddTeacher(false)}
                className="px-6 py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTeacher}
                disabled={adding}
                className="bg-gradient-to-r from-yellow-900 to-orange-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 transition-all"
              >
                {adding ? "Agregando..." : "Agregar Profesor"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-yellow-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
            Cargando ranking...
          </p>
        </div>
      ) : (
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
                <div className="flex items-center gap-2 bg-yellow-800/10 px-3 py-1.5 rounded-full border border-yellow-800/20">
                  <Star size={14} className="fill-yellow-800 text-yellow-800" />
                  <span className="text-xs font-black text-yellow-800">
                    {teacher.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                {teacher.name}
              </h3>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                {teacher.subject}
              </p>

              <div className="pt-6 border-t border-slate-800/50 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase">
                  {teacher.reviews.length} reseñas
                </span>
                <Link
                  to={`/ranking/${teacher._id}`}
                  className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-800 px-4 py-2 rounded-xl group-hover:bg-yellow-900 transition-all"
                >
                  Ver Perfil
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
