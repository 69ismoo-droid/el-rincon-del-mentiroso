import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { 
  Users, 
  MessageSquare, 
  Trophy, 
  Search, 
  Plus, 
  Bell, 
  Settings, 
  LogOut, 
  Home, 
  ChevronDown, 
  Menu, 
  X,
  ChevronRight,
  Eye,
  MessageCircle,
  Clock,
  User,
  Info,
  Shield,
  LayoutDashboard
} from 'lucide-react';
import { cn } from './lib/utils.ts';

// Components (will be created)
import Forum from './components/Forum.tsx';
import TeacherRanking from './components/TeacherRanking.tsx';
import LostFound from './components/LostFound.tsx';
import NewsList from './components/NewsList.tsx';
import Messages from './components/Messages.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import NotificationsList from './components/NotificationsList.tsx';

// --- AUTH CONTEXT ---
interface AuthContextType {
  user: any;
  authenticated: boolean;
  loading: boolean;
  notifications: any[];
  unreadCount: number;
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
  markAsRead: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        setAuthenticated(true);
        fetchNotifications();
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkAuth();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_SUCCESS') {
        checkAuth();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (authenticated && user) {
      socketRef.current = io();
      socketRef.current.emit('register', user._id);

      socketRef.current.on('notification', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [authenticated, user]);

  const login = () => {
    const width = 600, height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open('/api/auth/google', 'Google Login', `width=${width},height=${height},left=${left},top=${top}`);
  };

  const logout = async () => {
    await fetch('/api/auth/logout');
    setUser(null);
    setAuthenticated(false);
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider value={{ 
      user, 
      authenticated, 
      loading, 
      notifications, 
      unreadCount, 
      login, 
      logout, 
      refresh: checkAuth,
      markAsRead
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- NOTIFICATION COMPONENT ---
function NotificationCenter() {
  const { notifications, markAsRead, unreadCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAsRead();
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleToggle}
        className="relative p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 shadow-lg animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl z-30 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                   <Bell size={18} className="text-indigo-400" /> Notificaciones
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif: any) => (
                    <div 
                      key={notif._id} 
                      className={cn(
                        "p-5 border-b border-slate-800 hover:bg-slate-800/30 transition-colors flex gap-4 items-start",
                        !notif.read && "bg-indigo-500/5"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl border border-slate-700 overflow-hidden shrink-0">
                        <img src={notif.sender.picture} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-200 leading-tight mb-1">{notif.content}</p>
                        <div className="flex items-center gap-3">
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                <Clock size={10} /> {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-slate-600 text-xs">Sin actividad reciente</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800">
                  <Link to="/notificaciones" onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    Ver todas las notificaciones
                  </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- LAYOUT ---
function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Foro', icon: MessageSquare, path: '/foro' },
    { name: 'Mensajería', icon: MessageCircle, path: '/mensajeria' },
    { name: 'Profesores', icon: Trophy, path: '/ranking' },
    { name: 'Objetos Perdidos', icon: Search, path: '/objetos-perdidos' },
    { name: 'Noticias', icon: Bell, path: '/noticias' },
  ];

  if (['admin', 'superadmin'].includes(user.role)) {
    navItems.push({ name: 'Admin', icon: Shield, path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 transition-all duration-300 hidden md:flex flex-col z-20",
        isSidebarOpen ? "w-80" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <span className="font-black text-white text-xl">C</span>
             </div>
             {isSidebarOpen && <span className="font-black text-2xl text-white tracking-tighter uppercase italic">COAR</span>}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className="flex items-center gap-4 px-4 py-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all group"
            >
              <item.icon size={22} className="shrink-0 group-hover:scale-110 transition-transform" />
              {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-widest">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
            <button 
                onClick={logout}
                className="w-full flex items-center gap-4 px-4 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"
            >
                <LogOut size={22} />
                {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-widest">Cerrar Sesión</span>}
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hidden md:block">
              <Menu size={24} />
            </button>
            <div className="md:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="font-black text-white">C</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800">
                <img src={user.picture} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-white uppercase tracking-tighter truncate max-w-[120px]">{user.name}</p>
                <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{user.role}</span>
                </div>
              </div>
            </div>
            <NotificationCenter />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar">
           {children}
        </div>
      </main>
    </div>
  );
}

// --- PROTECTED ROUTE ---
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading, login } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
        />
    </div>
  );
  
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md w-full py-12 px-8 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl text-center">
           <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-8 overflow-hidden hover:scale-110 transition-transform">
              <span className="text-4xl font-black text-white italic">C</span>
           </div>
           <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4 italic">Bienvenido</h1>
           <p className="text-slate-400 text-sm font-medium mb-12">Accede a la plataforma central de la comunidad estudiantil para interactuar con tus compañeros.</p>
           <button 
             onClick={login}
             className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-xl"
           >
             <User size={20} /> Autenticarse
           </button>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

// --- DASHBOARD COMPONENT ---
function Dashboard() {
    const { user } = useAuth();
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <div className="bg-indigo-600 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl shadow-indigo-600/20">
                <div className="relative z-10">
                    <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase mb-4">Hola, {user.name.split(' ')[0]}!</h1>
                    <p className="text-indigo-100 text-lg font-bold uppercase tracking-widest max-w-2xl opacity-80 leading-relaxed">
                        Bienvenido al Centro de Control Maestro de la Comunidad Estudiantil. 
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
             </div>
             {/* Add more dashboard items here */}
        </div>
    );
}

// --- APP COMPONENT ---
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/foro" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><TeacherRanking /></ProtectedRoute>} />
          <Route path="/objetos-perdidos" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
          <Route path="/noticias" element={<ProtectedRoute><NewsList /></ProtectedRoute>} />
          <Route path="/mensajeria" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/notificaciones" element={<ProtectedRoute><NotificationsList /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
