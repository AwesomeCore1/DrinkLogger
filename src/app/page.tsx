"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from '@/firebase/config';

interface Log {
  id: string;
  drink_name: string;
  icon: string;
  notes?: string;
  created_at: Timestamp; // Firestore uses specific Timestamp objects
}

export default function DrinkTracker() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reference the 'logs' collection
    const q = query(collection(db, "logs"), orderBy("created_at", "desc"));

    // Set up the Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Log[];
      
      setLogs(liveData);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // --- HELPERS ---
  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleTimeString('nl-NL', { hour: '2-digit', minute:'2-digit'});
  };

  const getTodayLogs = () => {
    const today = new Date().toDateString();
    return logs.filter(log => log.created_at?.toDate().toDateString() === today);
  };

  const getHistoryLogs = () => {
    const today = new Date().toDateString();
    return logs.filter(log => log.created_at?.toDate().toDateString() !== today);
  };

  const todayLogs = getTodayLogs();
  const historyLogs = getHistoryLogs();

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-sky-500">Laden...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-10">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
            Peter&apos;s Tracker V2
          </h1>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold">Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        
        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-lg">
            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Vandaag</div>
            <div className="flex items-baseline">
              <div className="text-4xl font-bold text-white">{todayLogs.length}</div>
              <div className="ml-2 text-sm text-slate-500">items</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-lg">
            <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">Totaal</div>
            <div className="flex items-baseline">
              <div className="text-4xl font-bold text-sky-400">{logs.length}</div>
              <div className="ml-2 text-sm text-slate-500">items</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6 border border-slate-700/30">
          <button 
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'today' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Vandaag
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Geschiedenis
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {(activeTab === 'today' ? todayLogs : historyLogs).map((log) => (
            <div key={log.id} className="group flex items-center bg-slate-800 hover:bg-slate-750 p-4 rounded-xl border border-slate-700/50 transition-all active:scale-[0.99]">
              <div className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-full text-2xl mr-4 border border-slate-700 shadow-inner">
                {log.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-bold text-slate-200 truncate">{log.drink_name}</h3>
                  <span className="text-xs text-slate-500 font-mono ml-2 whitespace-nowrap">
                    {formatTime(log.created_at)}
                  </span>
                </div>
                {log.notes && (
                  <p className="text-sm text-sky-400/90 truncate">{log.notes}</p>
                )}
                 {activeTab === 'history' && (
                    <p className="text-xs text-slate-600 mt-1">
                      {log.created_at?.toDate().toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                 )}
              </div>
            </div>
          ))}
          
          {(activeTab === 'today' ? todayLogs : historyLogs).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600">
              <div className="text-4xl mb-3 opacity-20">🥃</div>
              <p>Nog niks te zien hier...</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}