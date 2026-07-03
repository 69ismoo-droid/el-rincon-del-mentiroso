import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Star, MessageSquare, Trash2, Plus } from "lucide-react";
import { useAuth } from "../App";
import { apiFetch } from "../lib/utils";

interface Teacher {
  _id: string;
  name: string;
  subject: string;
  rating: number;
  reviews: { user: string; rating: number; comment?: string; createdAt: string }[];
}

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTeacher();
  }, [id]);

  const loadTeacher = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/teachers/${id}`);
      if (!res.ok) {
        throw new Error("Profesor no encontrado");
      }
      const data = await res.json();
      setTeacher(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await apiFetch(`/api/teacher-ratings/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment.trim() || undefined,
        }),
      });
      
      if (res.ok) {
        setNewComment("");
        loadTeacher();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!confirm("¿Eliminar este profesor del ranking?")) return;
    try {
      const res = await apiFetch(`/api/teachers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        navigate("/ranking");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/ranking" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8">
            <ArrowLeft size={20} />
            <span className="font-bold text-sm uppercase tracking-widest">Volver al ranking</span>
          </Link>
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center">
            <p className="text-red-400 font-bold text-xl mb-4">{error || "Profesor no encontrado"}</p>
            <Link to="/ranking" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Volver al ranking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/ranking" className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-bold text-sm uppercase tracking-widest">Volver al ranking</span>
        </Link>

        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-[3rem] border border-indigo-800/50 p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div>
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-3">
                {teacher.name}
              </h1>
              <p className="text-2xl font-bold text-indigo-400 mb-2">
                {teacher.subject}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={24}
                      className={star <= Math.round(teacher.rating) ? "text-yellow-500 fill-yellow-500" : "text-slate-600"}
                    />
                  ))}
                </div>
                <span className="text-3xl font-black text-yellow-500">
                  {teacher.rating.toFixed(1)}
                </span>
                <span className="text-slate-500 font-bold">
                  ({teacher.reviews.length} reseñas)
                </span>
              </div>
            </div>

            {["admin", "superadmin"].includes(user?.role) && (
              <button
                onClick={handleDeleteTeacher}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={18} />
                Eliminar
              </button>
            )}
          </div>

          {/* Calificar Profesor */}
          <div className="bg-slate-900/80 rounded-3xl p-8 border border-slate-800 mb-8">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Star size={24} className="text-yellow-500" />
              Califica a este profesor
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Tu calificación
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-2"
                    >
                      <Star
                        size={32}
                        className={star <= newRating ? "text-yellow-500 fill-yellow-500" : "text-slate-600"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario constructivo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-500 resize-none h-24"
                />
              </div>
              <button
                onClick={handleSubmitRating}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Enviando..." : "Enviar Calificación"}
              </button>
            </div>
          </div>

          {/* Reseñas */}
          <div>
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <MessageSquare size={24} className="text-indigo-400" />
              Reseñas de la comunidad
            </h2>
            <div className="space-y-4">
              {teacher.reviews.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 font-bold">Aún no hay reseñas</p>
                  <p className="text-slate-600 text-sm mt-2">¡Sé el primero en calificar!</p>
                </div>
              ) : (
                teacher.reviews.map((review, index) => (
                  <div key={index} className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-600"}
                          />
                        ))}
                      </div>
                      <span className="text-slate-500 text-xs font-bold">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-slate-300 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
