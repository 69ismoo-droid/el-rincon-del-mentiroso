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
} from "lucide-react";
import { useAuth } from "../App";
import { apiFetch } from "../lib/utils";

interface AdminStats {
  users: number;
  posts: number;
  moderators: number;
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
  const canModerate = ["moderator", "admin", "superadmin"].includes(role);
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
            Panel de <span className="text-indigo-500">Control</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">
            {canAdmin
              ? "Gestión administrativa y moderación."
              : "Moderación del foro."}
          </p>
        </div>
        <div className="w-24 h-24 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center border border-indigo-600/20">
          <ShieldAlert size={48} className="text-indigo-500" />
        </div>
      </div>

      {canAdmin && (
        <>
          {error && (
            <p className="text-amber-500 text-sm font-bold px-4">
              No se pudieron cargar las estadísticas: {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
              <Users size={32} className="text-indigo-500" />
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
                {stats?.moderators ?? "—"}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Moderadores
              </p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
              <ShieldAlert size={32} className="text-yellow-500" />
              <p className="text-4xl font-black text-white">
                {stats?.posts ?? "—"}
              </p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Publicaciones en el foro
              </p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
              <Trophy size={32} className="text-purple-500" />
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
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <MessageSquare size={18} className="inline mr-2" /> Foro
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <Users size={18} className="inline mr-2" /> Usuarios
          </button>
          <button
            onClick={() => setActiveTab("bets")}
            className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
              activeTab === "bets"
                ? "bg-indigo-600 text-white"
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
                <MessageSquare className="text-indigo-400" size={28} />
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
                      ? "bg-indigo-600 text-white"
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
            <Users className="text-indigo-400" size={28} />
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
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Coins size={16} className="text-yellow-500" />
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
            <Trophy className="text-indigo-400" size={28} />
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
                      b.status === "closed" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-purple-500/10 text-purple-400"
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
                          <span className="text-yellow-500 font-bold flex items-center gap-1">
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
                        className="w-full bg-yellow-500/10 text-yellow-400 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-yellow-500/20"
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
    </div>
  );
}
