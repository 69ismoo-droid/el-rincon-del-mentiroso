import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, User, Search, MoreVertical, Bell, Shield } from 'lucide-react';
import { useAuth } from '../App.tsx';
import { cn } from '../lib/utils.ts';

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data);
      
      // Group by chat partner
      const chatMap = new Map();
      data.forEach((msg: any) => {
        const partner = msg.sender._id === user._id ? msg.recipient : msg.sender;
        if (!chatMap.has(partner._id)) {
          chatMap.set(partner._id, {
            partner,
            lastMessage: msg,
            unread: !msg.read && msg.recipient._id === user._id
          });
        }
      });
      setChats(Array.from(chatMap.values()));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: selectedChat.partner._id,
          content: newMessage
        })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentChatMessages = messages.filter(msg => 
    (msg.sender._id === selectedChat?.partner._id && msg.recipient._id === user._id) ||
    (msg.sender._id === user._id && msg.recipient._id === selectedChat?.partner._id)
  ).reverse();

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 border-r border-slate-800 flex flex-col">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Chats</h2>
            <div className="p-3 bg-slate-800 rounded-2xl text-slate-400">
               <MessageCircle size={20} />
            </div>
          </div>
          <div className="relative">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
             <input 
                type="text" 
                placeholder="Buscar contacto..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-2">
          {filteredChats.map((chat) => (
            <button 
              key={chat.partner._id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "w-full p-4 rounded-3xl flex gap-4 items-center transition-all group",
                selectedChat?.partner._id === chat.partner._id ? "bg-indigo-600 shadow-lg shadow-indigo-600/20" : "hover:bg-slate-800"
              )}
            >
              <div className="w-12 h-12 rounded-2xl border border-slate-700 overflow-hidden shrink-0">
                <img src={chat.partner.picture} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <p className={cn(
                        "text-sm font-black uppercase truncate",
                        selectedChat?.partner._id === chat.partner._id ? "text-white" : "text-slate-200"
                    )}>{chat.partner.name}</p>
                    {chat.unread && <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>}
                </div>
                <p className={cn(
                    "text-[10px] font-bold uppercase truncate",
                    selectedChat?.partner._id === chat.partner._id ? "text-indigo-100/70" : "text-slate-500"
                )}>{chat.lastMessage.content}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-950/20">
        {selectedChat ? (
          <>
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                        <img src={selectedChat.partner.picture} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{selectedChat.partner.name}</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">En línea</span>
                        </div>
                    </div>
                </div>
                <button className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500">
                    <MoreVertical size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-6 no-scrollbar">
                {currentChatMessages.map((msg, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, x: msg.sender._id === user._id ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={msg._id} 
                        className={cn(
                            "flex flex-col max-w-[70%]",
                            msg.sender._id === user._id ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                    >
                        <div className={cn(
                            "p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-lg",
                            msg.sender._id === user._id ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"
                        )}>
                            {msg.content}
                        </div>
                        <span className="text-[9px] font-black text-slate-600 uppercase mt-2 px-2">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-900/50">
                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Escribe un mensaje seguro..." 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="bg-indigo-600 p-4 rounded-2xl text-white hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                    >
                        <Send size={24} />
                    </button>
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex items-center justify-center mb-8 shadow-2xl">
                <Shield size={48} className="text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Chat Encriptado</h2>
            <p className="text-slate-600 text-xs font-bold uppercase tracking-[0.2em] max-w-xs leading-loose">
                Selecciona un contacto para iniciar una comunicación segura de punto a punto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
