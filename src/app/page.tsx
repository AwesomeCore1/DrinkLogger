'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Log } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Flame, Skull, Heart, Beer, TrendingUp, Calendar, Award, ChevronDown } from 'lucide-react';

const REACTION_ICONS = {
  '🍻': Beer,
  '🔥': Flame,
  '💀': Skull,
  '❤️': Heart,
};

export default function PublicDashboard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(10);
  const isFirstLoad = useRef(true);

  // Initialize User ID
  useEffect(() => {
    let storedId = localStorage.getItem('drink_tracker_uid');
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem('drink_tracker_uid', storedId);
    }
    setUserId(storedId);
  }, []);

  // Real-time listener & Confetti Logic
  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Log[];

      // Trigger confetti if a new log is added (and it's not the initial load)
      if (!isFirstLoad.current && data.length > logs.length && data.length > 0) {
        const newestLog = data[0];
        const now = new Date();
        const logTime = newestLog.created_at?.toDate();
        
        if (logTime && (now.getTime() - logTime.getTime() < 10000)) {
           triggerConfetti();
        }
      }

      setLogs(data);
      isFirstLoad.current = false;
    });

    return () => unsubscribe();
  }, [logs.length]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22d3ee', '#e879f9', '#f472b6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22d3ee', '#e879f9', '#f472b6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleReaction = async (logId: string, emoji: string) => {
    if (!userId) return;
    
    const log = logs.find(l => l.id === logId);
    if (!log) return;

    const currentReactions = log.reactions || {};
    
    // Find if user reacted with ANY emoji
    const existingEmoji = Object.keys(currentReactions).find(key => 
      currentReactions[key]?.includes(userId)
    );

    const logRef = doc(db, 'logs', logId);

    try {
      if (existingEmoji === emoji) {
        // Remove reaction (toggle off)
        await updateDoc(logRef, {
          [`reactions.${emoji}`]: arrayRemove(userId)
        });
      } else {
        // Switch reaction (or add new)
        const updates: Record<string, any> = {
          [`reactions.${emoji}`]: arrayUnion(userId)
        };
        
        if (existingEmoji) {
          updates[`reactions.${existingEmoji}`] = arrayRemove(userId);
        }
        
        await updateDoc(logRef, updates);
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  // --- STATS ---
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const getStartOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const weekStart = getStartOfWeek(new Date());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const todayCount = logs.filter(l => l.created_at?.toDate() >= todayStart).length;
    const weekCount = logs.filter(l => l.created_at?.toDate() >= weekStart).length;
    const monthCount = logs.filter(l => l.created_at?.toDate() >= monthStart).length;
    const yearCount = logs.filter(l => l.created_at?.toDate() >= yearStart).length;
    
    const counts: Record<string, number> = {};
    logs.forEach(l => counts[l.drink_name] = (counts[l.drink_name] || 0) + 1);
    
    const topDrinks = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return { todayCount, weekCount, monthCount, yearCount, totalCount: logs.length, topDrinks };
  }, [logs]);

  const maxCount = stats.topDrinks[0]?.count || 1;

  const formatLogDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Vandaag ${timeStr}`;
    if (isYesterday) return `Gisteren ${timeStr}`;
    return `${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} ${timeStr}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-cyan-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-pink-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 pb-20">
        {/* Header */}
        <header className="flex items-center justify-between py-8 mb-8">
          <div className="relative group cursor-default">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <h1 className="relative text-4xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent transform transition-transform group-hover:scale-105 duration-300">
              DRINK<br/>TRACKER
            </h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg shadow-purple-500/10 hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-green-400 uppercase">Live</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Stats */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-8">
            {logs.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 mb-6 lg:mb-0"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-cyan-200 transition-colors">
                    <Calendar size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>Vandaag</span>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stats.todayCount}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-purple-200 transition-colors">
                    <Calendar size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Deze Week</span>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stats.weekCount}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-pink-200 transition-colors">
                    <Calendar size={14} className="text-pink-400 group-hover:scale-110 transition-transform" />
                    <span>Deze Maand</span>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stats.monthCount}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors group cursor-default">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-green-200 transition-colors">
                    <TrendingUp size={14} className="text-green-400 group-hover:scale-110 transition-transform" />
                    <span>Dit Jaar</span>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stats.yearCount}</div>
                </div>
                
                {/* Top Drinks Chart */}
                <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                    <Award size={14} className="text-yellow-400" />
                    <span>Favorieten</span>
                  </div>
                  <div className="space-y-3">
                    {stats.topDrinks.map((drink, idx) => (
                      <div key={drink.name} className="relative">
                        <div className="flex justify-between text-xs font-bold mb-1 z-10 relative">
                          <span className="text-slate-200">{drink.name}</span>
                          <span className="text-slate-500">{drink.count}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(drink.count / maxCount) * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              idx === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                              'bg-gradient-to-r from-orange-700 to-orange-800'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Content: List */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence initial={false} mode='popLayout'>
                {logs.slice(0, visibleCount).map((log) => (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative group h-full"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-cyan-500/10">
                      <div className="flex items-start gap-5 flex-1">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 rounded-2xl text-4xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-300">
                          {log.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-xl text-white truncate leading-tight group-hover:text-cyan-200 transition-colors">
                              {log.drink_name}
                            </h3>
                            <span className="text-xs font-bold text-slate-400 bg-black/20 px-2 py-1 rounded-lg ml-2 whitespace-nowrap border border-white/5">
                              {formatLogDate(log.created_at)}
                            </span>
                          </div>
                          
                          {log.notes && (
                            <p className="text-slate-400 text-sm mt-2 leading-relaxed break-words">
                              {log.notes}
                            </p>
                          )}

                          {/* Reactions */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {Object.entries(REACTION_ICONS).map(([emoji, Icon]) => {
                              const reactions = log.reactions?.[emoji] || [];
                              const count = reactions.length;
                              const hasReacted = reactions.includes(userId);
                              
                              return (
                                <motion.button
                                  key={emoji}
                                  whileTap={{ scale: 0.85 }}
                                  whileHover={{ scale: 1.05 }}
                                  onClick={() => handleReaction(log.id, emoji)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    hasReacted 
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                                      : 'bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <Icon 
                                    size={14} 
                                    className={hasReacted ? 'fill-cyan-300 text-cyan-300' : ''} 
                                  />
                                  {count > 0 && <span>{count}</span>}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {logs.length > visibleCount && (
              <button 
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="w-full py-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all font-bold text-sm"
              >
                <ChevronDown size={16} />
                <span>Meer laden</span>
              </button>
            )}

            {logs.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 opacity-20 grayscale">🪩</div>
                <p className="text-slate-500 font-medium">Het feest is nog niet begonnen...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
