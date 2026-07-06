import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { 
  Users, 
  MessageSquare, 
  Trophy,
  Coins,
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
  LayoutDashboard,
  Cookie,
  FileText,
  Lock,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { cn, apiFetch } from './lib/utils';

// Components (will be created)
import Forum from './components/Forum';
import TeacherRanking from './components/TeacherRanking';
import LostFound from './components/LostFound';
import NewsList from './components/NewsList';
import Register from './components/Register';
import LoginNew from './components/LoginNew';
import VerifyOTP from './components/VerifyOTP';
import CompleteProfile from './components/CompleteProfile';
import Messages from './components/Messages';
import AdminPanel from './components/AdminPanel';
import NotificationsList from './components/NotificationsList';
import Betting from './components/Betting';
import CookieConsent from './components/CookieConsent';
import TerminosCondiciones from './components/TerminosCondiciones';
import PoliticaPrivacidad from './components/PoliticaPrivacidad';
import PoliticaCookies from './components/PoliticaCookies';
import AnioIngresoForm from './components/AnioIngresoForm';
import Leaderboard from './components/Leaderboard';
import TeacherProfile from './components/TeacherProfile';
import DisplayNameForm from './components/DisplayNameForm';

// --- AUTH CONTEXT ---
interface User {
  _id: string;
  email: string;
  nombreCompleto: string;
  displayName?: string;
  name: string;
  añoIngreso: number;
  ingresoColegio?: number;
  role: 'user' | 'semiadmin' | 'admin' | 'superadmin';
  isVerified: boolean;
  credits: number;
  bio: string;
  picture: string;
}

interface Notification {
  _id: string;
  content: string;
  read: boolean;
  createdAt: Date;
  sender?: {
    picture: string;
  };
}

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  notifications: Notification[];
  unreadCount: number;
  loginError: string | null;
  login: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
  markAsRead: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // El login ahora se maneja en el componente LoginNew
    console.log('Login function called - should be handled by LoginNew component');
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout');
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refresh = async () => {
    await fetchUser();
  };

  const markAsRead = async () => {
    if (!user) return;
    try {
      await apiFetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Detectar cambios en la sesión (cuando el usuario hace login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return; // Solo cargar notificaciones si hay usuario autenticado
      
      try {
        const res = await apiFetch('/api/notifications');
        if (res.ok) {
          const notifs = await res.json();
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n: any) => !n.read).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const authenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        loading,
        notifications,
        unreadCount,
        loginError,
        login,
        logout,
        refresh,
        markAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --- NOTIFICATION COMPONENT ---
function NotificationCenter() {
  const { notifications, unreadCount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
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
                        {notif.sender?.picture ? (
                          <img src={notif.sender.picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <User size={16} className="text-slate-400" />
                          </div>
                        )}
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
    { name: 'Profesores', icon: Trophy, path: '/ranking' },
    { name: 'Top 10 Monedas', icon: Coins, path: '/leaderboard' },
    { name: 'Objetos Perdidos', icon: Search, path: '/objetos-perdidos' },
    { name: 'Noticias', icon: Bell, path: '/noticias' },
    { name: 'Apuestas', icon: Coins, path: '/apuestas' },
  ];

  if (user && ['semiadmin', 'admin', 'superadmin'].includes(user.role)) {
    navItems.push({ name: 'Admin', icon: Shield, path: '/admin' });
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "glass-effect transition-all duration-300 hidden md:flex flex-col z-20",
        isSidebarOpen ? "w-80" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover-lift">
             <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/40 border-gradient">
                <span className="font-black text-white text-xl">C</span>
             </div>
             {isSidebarOpen && <span className="font-black text-2xl text-white tracking-tighter uppercase italic text-glow">COAR</span>}
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              className="flex items-center gap-4 px-4 py-4 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-2xl transition-all group hover-lift"
            >
              <item.icon size={22} className="shrink-0 group-hover:scale-110 transition-transform" />
              {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-widest">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
            <button 
                onClick={logout}
                className="w-full flex items-center gap-4 px-4 py-4 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all hover-lift"
            >
                <LogOut size={22} />
                {isSidebarOpen && <span className="font-bold text-sm uppercase tracking-widest">Cerrar Sesión</span>}
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 glass-effect border-b border-slate-800/50 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hidden md:block">
              <Menu size={24} />
            </button>
            <div className="md:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="font-black text-white">C</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 glass-effect rounded-2xl hover-lift">
              <div className="w-8 h-8 rounded-lg overflow-hidden border-2 border-indigo-500/30">
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <User size={16} className="text-slate-400" />
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-white uppercase tracking-tighter truncate max-w-[120px]">{user?.displayName || user?.nombreCompleto || user?.name || 'Usuario'}</p>
                <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                      {user?.role === 'semiadmin' ? 'Semi Admin' : 
                       user?.role === 'admin' ? 'Admin' : 
                       user?.role === 'superadmin' ? 'Superadmin' : 'Usuario'}
                    </span>
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
  const { authenticated, loading, loginError } = useAuth();
  const navigate = useNavigate();
  
  if (loading) return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
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
        <div className="max-w-md w-full py-12 px-8 glass-effect rounded-[3rem] shadow-2xl text-center border-gradient">
           <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-8 overflow-hidden hover:scale-110 transition-transform border-gradient">
              <span className="text-4xl font-black text-white italic animate-pulse">C</span>
           </div>
           <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4 italic">Bienvenido</h1>
           <p className="text-slate-400 text-sm font-medium mb-8">Accede a la plataforma central de la comunidad estudiantil para interactuar con tus compañeros.</p>
           {loginError && (
             <p className="text-amber-400 text-sm font-medium mb-8 text-left bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3">
               {loginError}
             </p>
           )}
           <button 
             onClick={() => navigate('/login')}
             className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3 shadow-xl hover-lift border-gradient"
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
    const { user, refresh } = useAuth();
    const [showAnioForm, setShowAnioForm] = useState(false);
    const [showDisplayNameForm, setShowDisplayNameForm] = useState(false);

    const handleBuyCoins = async (pkg: string) => {
        const packageInfo = coinPackages.find(p => p.name === pkg);
        const message = `Hola, quiero comprar el ${packageInfo?.label} (+${packageInfo?.coins} créditos). Mi email: ${user?.email}`;
        const whatsappUrl = `https://wa.me/51900842735?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const coinPackages = [
        { name: "basic", label: "Paquete Básico", coins: 100, price: "Gratis", color: "from-blue-600 to-cyan-600" },
        { name: "standard", label: "Paquete Estándar", coins: 500, price: "Gratis", color: "from-purple-600 to-pink-600" },
        { name: "premium", label: "Paquete Premium", coins: 2000, price: "Gratis", color: "from-yellow-600 to-orange-600" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl shadow-indigo-600/20 border-gradient">
                <div className="relative z-10">
                    <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase mb-4 text-glow animate-fade-in-up">Hola, {(user?.nombreCompleto || user?.name || 'Usuario').split(' ')[0]}!</h1>
                    <p className="text-indigo-100 text-lg font-bold uppercase tracking-widest max-w-2xl opacity-90 leading-relaxed">
                        Bienvenido al Centro de Control Maestro de la Comunidad Estudiantil. 
                    </p>
                    <div className="mt-8 flex items-center gap-4 bg-white/10 p-6 rounded-2xl">
                        <Coins size={40} className="text-yellow-400" />
                        <div>
                            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Créditos disponibles</p>
                            <p className="text-5xl font-black text-white">{user?.credits?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
             </div>

             {/* Paquetes de Monedas */}
             <div className="glass-effect rounded-3xl p-8 border-gradient">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
                    <Coins size={24} className="text-yellow-500" />
                    Obtener más créditos
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {coinPackages.map((pkg) => (
                        <div key={pkg.name} className="bg-slate-900 rounded-2xl p-8 border border-slate-800 hover:border-indigo-600/50 transition-all hover-lift">
                            <div className={`w-full h-20 bg-gradient-to-r ${pkg.color} rounded-xl flex items-center justify-center mb-6`}>
                                <Coins size={40} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">{pkg.label}</h3>
                            <p className="text-3xl font-black text-yellow-500 mb-6">+{pkg.coins.toLocaleString()} 🪙</p>
                            <button
                                onClick={() => handleBuyCoins(pkg.name)}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all bg-gradient-to-r ${pkg.color} text-white hover:opacity-90`}
                            >
                                Obtener
                            </button>
                        </div>
                    ))}
                </div>
             </div>

             {/* Año de Ingreso Card */}
             <div className="glass-effect rounded-3xl p-8 border-gradient">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Calendar size={24} className="text-indigo-400" />
                        Información de Perfil
                    </h2>
                    {!(user?.ingresoColegio || user?.añoIngreso) && (
                        <button
                            onClick={() => setShowAnioForm(true)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all hover-lift border-gradient text-sm"
                        >
                            Completar Perfil
                        </button>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-effect rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Nombre de Usuario</h3>
                        <p className="text-slate-400">
                            {user?.displayName ? (
                                <span className="text-indigo-400 font-bold">{user.displayName}</span>
                            ) : (
                                <span className="text-slate-500">No establecido</span>
                            )}
                        </p>
                        {!user?.displayName && (
                            <button
                                onClick={() => setShowDisplayNameForm(true)}
                                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Establecer nombre
                            </button>
                        )}
                    </div>

                    <div className="glass-effect rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Año de Ingreso</h3>
                        <p className="text-slate-400">
                            {user?.ingresoColegio || user?.añoIngreso ? (
                                <span className="text-indigo-400 font-bold">{user?.ingresoColegio || user?.añoIngreso}</span>
                            ) : (
                                <span className="text-slate-500">No especificado</span>
                            )}
                        </p>
                        {!user?.ingresoColegio && !user?.añoIngreso && (
                            <p className="text-xs text-slate-500 mt-2">
                                Agrega tu año de ingreso para que la comunidad conozca tu generación en el foro.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    {user?.displayName && (
                        <button
                            onClick={() => setShowDisplayNameForm(true)}
                            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-all hover-lift text-sm"
                        >
                            Editar Nombre
                        </button>
                    )}
                    {(user?.ingresoColegio || user?.añoIngreso) && (
                        <button
                            onClick={() => setShowAnioForm(true)}
                            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-all hover-lift text-sm"
                        >
                            Editar Año
                        </button>
                    )}
                </div>
             </div>

             {/* Modals */}
             {showAnioForm && (
                <AnioIngresoForm onClose={() => setShowAnioForm(false)} />
             )}
             {showDisplayNameForm && (
                <DisplayNameForm onClose={() => setShowDisplayNameForm(false)} />
             )}
        </div>
    );
}

// --- APP COMPONENT ---
export default function App() {
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  const handleCookieAccept = () => {
    setShowCookieConsent(false);
  };

  const handleCookieReject = () => {
    setShowCookieConsent(false);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/foro" element={<ProtectedRoute><Forum /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><TeacherRanking /></ProtectedRoute>} />
          <Route path="/ranking/:id" element={<ProtectedRoute><TeacherProfile /></ProtectedRoute>} />
          <Route path="/objetos-perdidos" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
          <Route path="/noticias" element={<ProtectedRoute><NewsList /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/notificaciones" element={<ProtectedRoute><NotificationsList /></ProtectedRoute>} />
          <Route path="/apuestas" element={<ProtectedRoute><Betting /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/login" element={<LoginNew />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verificar-otp" element={<VerifyOTP />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/terminos" element={<TerminosCondiciones />} />
          <Route path="/privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/cookies" element={<PoliticaCookies />} />
        </Routes>
        
        {/* Cookie Consent Banner */}
        <CookieConsent 
          onAccept={handleCookieAccept} 
          onReject={handleCookieReject} 
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
