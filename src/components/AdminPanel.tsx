import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Shield,
  ShieldAlert,
  Trash2,
  MessageSquare,
  Coins,
  Trophy,
  Ban,
  Edit,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  X,
} from "lucide-react";
import { useAuth } from "../App";
import { apiFetch } from "../lib/utils";

interface AdminStats {
  users: number;
  posts: number;
  semiadmins: number;
  bets: number;
}

interface ModPost {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: { name?: string; email?: string };
}

interface User {
  _id: string;
  email: string;
  nombreCompleto?: string;
  name?: string;
  role: string;
  credits: number;
  banned: boolean;
  createdAt: string;
}

interface Bet {
  _id: string;
  event: string;
  status: string;
  winner?: string;
  options: { name: string; pool: number }[];
  participants: { user: string; option: string; amount: number }[];
  creator?: { name?: string; email?: string };
  createdAt: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const canModerate = ["semiadmin", "admin", "superadmin"].includes(role);
  const canAdmin = ["admin", "superadmin"].includes(role);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"forum" | "users" | "bets">("forum");

  // Foro
  const [modPosts, setModPosts] = useState<ModPost[]>([]);
  const [modQ, setModQ] = useState("");
  const [modErr, setModErr] = useState<string | null>(null);
  const [modPage, setModPage] = useState(1);
  const [modTotalPages, setModTotalPages] = useState(1);

  // Usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [usersErr, setUsersErr] = useState<string | null>(null);

  // Apuestas
  const [bets, setBets] = useState<Bet[]>([]);
  const [betsErr, setBetsErr] = useState<string | null>(null);

  // Términos y condiciones
  const [showTerms, setShowTerms] = useState(false);

  const loadStats = useCallback(() => {
    if (!canAdmin) return;
    apiFetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? res.statusText);
        }
        return res.json();
      })
      .then((data: AdminStats) => setStats(data))
      .catch((e: Error) => setError(e.message));
  }, [canAdmin]);

  const loadModPosts = useCallback(
    async (page = 1) => {
      if (!canModerate) return;
      setModErr(null);
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (modQ.trim()) params.set("q", modQ.trim());
      const res = await apiFetch(`/api/admin/forum/posts?${params}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModErr((j as { error?: string }).error ?? "Error al cargar el foro");
        return;
      }
      setModPosts((j as { items?: ModPost[] }).items ?? []);
      setModPage((j as { page?: number }).page ?? 1);
      setModTotalPages((j as { totalPages?: number }).totalPages ?? 1);
    },
    [canModerate, modQ]
  );

  const loadUsers = useCallback(async () => {
    if (!canAdmin) return;
    setUsersErr(null);
    const res = await apiFetch("/api/admin/users");
    const j = await res.json().catch(() => []);
    if (!res.ok) {
      setUsersErr("Error al cargar usuarios");
      return;
    }
    setUsers(j as User[]);
  }, [canAdmin]);

  const loadBets = useCallback(async () => {
    if (!canAdmin) return;
    setBetsErr(null);
    const res = await apiFetch("/api/admin/bets");
    const j = await res.json().catch(() => []);
    if (!res.ok) {
      setBetsErr("Error al cargar apuestas");
      return;
    }
    setBets(j as Bet[]);
  }, [canAdmin]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (canModerate) void loadModPosts(1);
    }, 300);
    return () => clearTimeout(t);
  }, [canModerate, modQ, loadModPosts]);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "bets") loadBets();
  }, [activeTab, loadUsers, loadBets]);

  const deleteForumPost = async (id: string) => {
    if (!confirm("¿Eliminar esta publicación y sus comentarios?")) return;
    setModErr(null);
    const res = await apiFetch(`/api/admin/forum/posts/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setModErr((j as { error?: string }).error ?? "Error al eliminar");
      return;
    }
    void loadModPosts(modPage);
    loadStats();
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const res = await apiFetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      loadUsers();
      loadStats();
    }
  };

  const updateBet = async (betId: string, updates: Partial<Bet>) => {
    const res = await apiFetch(`/api/admin/bets/${betId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      loadBets();
      loadStats();
    }
  };

  const deleteBet = async (betId: string) => {
    if (!confirm("¿Eliminar esta apuesta y devolver créditos a los participantes?")) return;
    const res = await apiFetch(`/api/admin/bets/${betId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadBets();
      loadStats();
    }
  };

  if (!canModerate) {
    return (
      <div className="p-20 text-center text-red-500 font-bold uppercase tracking-widest">
        Acceso Denegado
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div className="bg-slate-900/50 p-12 rounded-[3.5rem] border border-slate-800 flex justify-between items-center shadow-2xl">
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
            Panel de <span className="text-blue-700">Control</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
            {canAdmin
              ? "Gestión administrativa y moderación."
              : "Moderación del foro."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.email === 'admin@cusco.coar.edu.pe' && (
            <button
              onClick={() => setShowTerms(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-700 transition-all"
            >
              <FileText size={18} />
              Términos y Condiciones
            </button>
          )}
          <div className="w-24 h-24 bg-blue-700/10 rounded-[2.5rem] flex items-center justify-center border border-blue-700/20">
            <ShieldAlert size={48} className="text-blue-700" />
          </div>
        </div>
      </div>

      {canAdmin && (
        <>
          {error && (
            <p className="text-amber-800 text-sm font-bold px-4">
              No se pudieron cargar las estadísticas: {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
              <Users size={32} className="text-blue-700" />
              <p className="text-4xl font-black text-white">
                {stats?.users ?? "—"}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Usuarios registrados
              </p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
              <Shield size={32} className="text-green-500" />
              <p className="text-4xl font-black text-white">
                {stats?.semiadmins ?? "—"}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Semi-Admins
              </p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
              <ShieldAlert size={32} className="text-yellow-800" />
              <p className="text-4xl font-black text-white">
                {stats?.posts ?? "—"}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Publicaciones en el foro
              </p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
              <Trophy size={32} className="text-red-600" />
              <p className="text-4xl font-black text-white">
                {stats?.bets ?? "—"}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Apuestas activas
              </p>
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      {canAdmin && (
        <div className="flex gap-4 p-2 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("forum")}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
              activeTab === "forum"
                ? "bg-blue-700 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <MessageSquare size={18} className="inline mr-2" /> Foro
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
              activeTab === "users"
                ? "bg-blue-700 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <Users size={18} className="inline mr-2" /> Usuarios
          </button>
          <button
            onClick={() => setActiveTab("bets")}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
              activeTab === "bets"
                ? "bg-blue-700 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <Trophy size={18} className="inline mr-2" /> Apuestas
          </button>
        </div>
      )}

      {/* Contenido según tab */}
      {(!canAdmin || activeTab === "forum") && (
        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <MessageSquare className="text-blue-400" size={28} />
                Moderación del foro
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
                Elimina publicaciones inapropiadas. También se borran comentarios
                vinculados.
              </p>
            </div>
            <input
              type="search"
              value={modQ}
              onChange={(e) => setModQ(e.target.value)}
              placeholder="Buscar en título o contenido…"
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white max-w-md w-full"
            />
          </div>
          {modErr && (
            <p className="text-red-400 text-sm font-bold">{modErr}</p>
          )}
          <div className="space-y-3">
            {modPosts.length === 0 ? (
              <p className="text-slate-600 text-sm py-8 text-center">
                No hay publicaciones que mostrar.
              </p>
            ) : (
              modPosts.map((p) => (
                <div
                  key={p._id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50 flex flex-col md:flex-row md:items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {p.author?.name ?? "—"}{" "}
                      {p.author?.email ? `· ${p.author.email}` : ""} ·{" "}
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-sm line-clamp-2 mt-2">
                      {p.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteForumPost(p._id)}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/20"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
          {modTotalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: modTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void loadModPosts(p)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm ${
                    p === modPage
                      ? "bg-blue-700 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {canAdmin && activeTab === "users" && (
        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Users className="text-blue-400" size={28} />
            Gestión de Usuarios
          </h2>
          {usersErr && (
            <p className="text-red-400 text-sm font-bold">{usersErr}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="py-4 px-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Usuario
                  </th>
                  <th className="py-4 px-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Rol
                  </th>
                  <th className="py-4 px-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Créditos
                  </th>
                  <th className="py-4 px-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Estado
                  </th>
                  <th className="py-4 px-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-800/50">
                    <td className="py-4 px-4">
                      <p className="text-white font-bold">{u.nombreCompleto || u.name || "Sin nombre"}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateUser(u._id, { role: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="user">Usuario</option>
                        <option value="semiadmin">Semi Admin</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Coins size={16} className="text-yellow-800" />
                        <input
                          type="number"
                          value={u.credits}
                          onChange={(e) => updateUser(u._id, { credits: parseInt(e.target.value) || 0 })}
                          className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {u.banned ? (
                        <span className="flex items-center gap-2 text-red-400 text-sm font-bold">
                          <Ban size={16} /> Baneado
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-green-400 text-sm font-bold">
                          <CheckCircle2 size={16} /> Activo
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => updateUser(u._id, { banned: !u.banned })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          u.banned
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        }`}
                      >
                        {u.banned ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                        {u.banned ? "Desbanear" : "Banear"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canAdmin && activeTab === "bets" && (
        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Trophy className="text-blue-400" size={28} />
            Gestión de Apuestas
          </h2>
          {betsErr && (
            <p className="text-red-400 text-sm font-bold">{betsErr}</p>
          )}
          <div className="space-y-4">
            {bets.map((b) => (
              <div key={b._id} className="p-6 rounded-2xl border border-slate-800 bg-slate-950/50">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{b.event}</h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Creado por: {b.creator?.name || "Anónimo"} · {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                      b.status === "open" ? "bg-green-500/10 text-green-400" :
                      b.status === "closed" ? "bg-yellow-800/10 text-yellow-700" :
                      "bg-red-600/10 text-red-400"
                    }`}>
                      {b.status}
                    </span>
                    <button
                      onClick={() => deleteBet(b._id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/20"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Opciones</p>
                    <div className="space-y-2">
                      {b.options.map((opt, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl">
                          <span className="text-white font-medium">{opt.name}</span>
                          <span className="text-yellow-800 font-bold flex items-center gap-1">
                            <Coins size={14} /> {opt.pool}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {b.status === "open" && (
                    <div className="space-y-3">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Gestionar</p>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            updateBet(b._id, { winner: e.target.value, status: "resolved" });
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                        defaultValue=""
                      >
                        <option value="">Seleccionar ganador</option>
                        {b.options.map((opt, idx) => (
                          <option key={idx} value={opt.name}>{opt.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateBet(b._id, { status: "closed" })}
                        className="w-full bg-yellow-800/10 text-yellow-700 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-yellow-800/20"
                      >
                        Cerrar apuestas
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="text-slate-500 text-xs">
                  {b.participants.length} participante{ b.participants.length !== 1 ? "s" : "" }
                </p>
              </div>
            ))}
            {bets.length === 0 && (
              <p className="text-slate-600 text-sm py-8 text-center">
                No hay apuestas que mostrar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Términos y Condiciones */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] p-10 shadow-2xl border border-slate-800 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                Términos y <span className="text-blue-700">Condiciones</span>
              </h2>
              <button
                onClick={() => setShowTerms(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-slate-300 text-sm leading-relaxed">
              <section>
                <h3 className="text-xl font-bold text-white mb-3">1. Aceptación de Términos</h3>
                <p>
                  Al acceder y utilizar la plataforma del COAR Cusco, usted acepta y se compromete a cumplir
                  con estos términos y condiciones. Si no está de acuerdo con alguno de estos términos,
                  por favor no utilice la plataforma.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">2. Uso de la Plataforma</h3>
                <p>
                  La plataforma está destinada exclusivamente para uso de la comunidad estudiantil del
                  COAR Cusco. Se prohíbe el uso comercial, la distribución no autorizada del contenido,
                  y cualquier actividad que viole las leyes peruanas aplicables.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">3. Contenido del Usuario</h3>
                <p>
                  Los usuarios son responsables de todo el contenido que publican en la plataforma,
                  incluyendo pero no limitado a publicaciones en el foro, comentarios, y mensajes.
                  Se prohíbe:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Contenido ofensivo, discriminatorio o de odio</li>
                  <li>Harassment o acoso a otros usuarios</li>
                  <li>Información falsa o engañosa</li>
                  <li>Contenido que viole la privacidad de terceros</li>
                  <li>Spam o publicidad no autorizada</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">4. Privacidad y Datos</h3>
                <p>
                  La plataforma recopila información personal necesaria para el funcionamiento del
                  sistema. Esta información incluye nombre, correo electrónico, y datos académicos.
                  Nos comprometemos a proteger su privacidad y no compartir su información con terceros
                  sin su consentimiento, excepto cuando sea requerido por ley.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">5. Créditos y Apuestas</h3>
                <p>
                  El sistema de créditos es virtual y no tiene valor monetario real. Las apuestas son
                  solo para fines de entretenimiento y no constituyen juego de dinero real. La
                  administración se reserva el derecho de modificar el sistema de créditos en cualquier
                  momento.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">6. Moderación y Sanciones</h3>
                <p>
                  La administración se reserva el derecho de moderar el contenido y sancionar a usuarios
                  que violen estos términos. Las sanciones pueden incluir:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Advertencias</li>
                  <li>Suspensión temporal de la cuenta</li>
                  <li>Baneo permanente de la plataforma</li>
                  <li>Pérdida de créditos</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">7. Propiedad Intelectual</h3>
                <p>
                  Todo el contenido de la plataforma, incluyendo diseño, código, textos, gráficos,
                  logos, y software, es propiedad del COAR Cusco y está protegido por las leyes de
                  propiedad intelectual peruanas.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">8. Modificaciones</h3>
                <p>
                  La administración se reserva el derecho de modificar estos términos y condiciones
                  en cualquier momento. Los usuarios serán notificados de cambios significativos.
                  El uso continuado de la plataforma después de dichos cambios constituye aceptación
                  de los nuevos términos.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">9. Contacto</h3>
                <p>
                  Para cualquier pregunta o concerniente sobre estos términos, puede contactar al
                  administrador en: admin@cusco.coar.edu.pe
                </p>
              </section>

              <section className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  Última actualización: Julio 2026
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
