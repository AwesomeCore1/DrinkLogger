'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Log, Category, DrinkType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Settings, X, Plus, Trash2, History, Zap } from 'lucide-react';

// --- COMPONENTS ---

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-slate-900 rounded-full shadow-2xl z-50 font-bold flex items-center gap-2 whitespace-nowrap"
    >
      {message}
    </motion.div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl"
      >
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md p-4 border-b border-slate-800 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
      >
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors">
            Annuleren
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors">
            Bevestigen
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function AdminPage({ params }: { params: Promise<{ secret: string }> }) {
  const { secret } = use(params);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  
  // Data
  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // UI State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  // Settings Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkIcon, setNewDrinkIcon] = useState('🍺');
  const [settingsCatId, setSettingsCatId] = useState<string>('');

  // Security Check
  useEffect(() => {
    setAuthorized(secret === process.env.NEXT_PUBLIC_ADMIN_SECRET);
  }, [secret]);

  // Data Fetching
  useEffect(() => {
    if (!authorized) return;

    const unsubLogs = onSnapshot(query(collection(db, 'logs'), orderBy('created_at', 'desc'), limit(100)), (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Log)));
    });

    const unsubCats = onSnapshot(query(collection(db, 'categories')), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });

    return () => { unsubLogs(); unsubCats(); };
  }, [authorized]);

  // --- COMPUTED DATA ---

  // Speed Dial: Top 3 most frequent drinks
  const speedDialDrinks = useMemo(() => {
    const counts: Record<string, { count: number, drink: DrinkType }> = {};
    
    logs.forEach(log => {
      const key = `${log.drink_name}-${log.icon}`;
      if (!counts[key]) {
        counts[key] = { 
          count: 0, 
          drink: { id: 'speed-dial', name: log.drink_name, icon: log.icon } 
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.drink);
  }, [logs]);

  // Filtered Drinks
  const filteredDrinks = useMemo(() => {
    let allDrinks: (DrinkType & { categoryId: string })[] = [];
    categories.forEach(cat => {
      cat.drinks?.forEach(drink => {
        allDrinks.push({ ...drink, categoryId: cat.id });
      });
    });

    if (searchQuery) {
      return allDrinks.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedCategoryId === 'all') return allDrinks;
    
    return allDrinks.filter(d => d.categoryId === selectedCategoryId);
  }, [categories, selectedCategoryId, searchQuery]);

  // --- ACTIONS ---

  const handleAddLog = async (drink: DrinkType) => {
    try {
      await addDoc(collection(db, 'logs'), {
        drink_name: drink.name,
        icon: drink.icon,
        created_at: serverTimestamp(),
        reactions: {}
      });
      setToastMessage(`${drink.name} toegevoegd! 🚀`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteLog = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Logboek Verwijderen',
      message: 'Weet je zeker dat je dit logboek wilt verwijderen?',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'logs', id));
      }
    });
  };

  // Settings Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    await addDoc(collection(db, 'categories'), { name: newCategoryName, drinks: [] });
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Categorie Verwijderen',
      message: 'Weet je zeker dat je deze categorie wilt verwijderen?',
      onConfirm: async () => {
        await deleteDoc(doc(db, 'categories', id));
      }
    });
  };

  const handleAddDrinkType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsCatId || !newDrinkName) return;
    const newDrink: DrinkType = { id: crypto.randomUUID(), name: newDrinkName, icon: newDrinkIcon };
    await updateDoc(doc(db, 'categories', settingsCatId), { drinks: arrayUnion(newDrink) });
    setNewDrinkName('');
  };

  const handleDeleteDrinkType = async (catId: string, drink: DrinkType) => {
    setConfirmModal({
      isOpen: true,
      title: 'Drankje Verwijderen',
      message: `Weet je zeker dat je ${drink.name} wilt verwijderen?`,
      onConfirm: async () => {
        await updateDoc(doc(db, 'categories', catId), { drinks: arrayRemove(drink) });
      }
    });
  };

  const handleSeedDatabase = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Database Vullen',
      message: 'Dit voegt standaard categorieën en drankjes toe. Doorgaan?',
      onConfirm: async () => {
        const SEED_DATA = [
          {
            name: 'Alcoholisch',
            drinks: [
              { id: 'alc-1', name: 'Bier', icon: '🍺' },
              { id: 'alc-2', name: 'Wijn', icon: '🍷' },
              { id: 'alc-3', name: 'Cocktail', icon: '🍸' },
              { id: 'alc-4', name: 'Sterk', icon: '🥃' },
            ]
          },
          {
            name: 'Non-Alcoholisch',
            drinks: [
              { id: 'na-1', name: 'Fris', icon: '🥤' },
              { id: 'na-2', name: 'Water', icon: '💧' },
              { id: 'na-3', name: 'Koffie', icon: '☕' },
              { id: 'na-4', name: 'Thee', icon: '🍵' },
            ]
          }
        ];
    
        try {
          for (const cat of SEED_DATA) {
            await addDoc(collection(db, 'categories'), {
              name: cat.name,
              drinks: cat.drinks
            });
          }
          setToastMessage('Database gevuld! 🌱');
        } catch (error) {
          console.error(error);
          setToastMessage('Fout bij vullen database');
        }
      }
    });
  };

  // --- RENDER ---

  if (authorized === null) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Laden...</div>;
  if (authorized === false) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-bold">TOEGANG GEWEIGERD</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <AnimatePresence>
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      </AnimatePresence>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Zoek drankjes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Speed Dial */}
        {!searchQuery && speedDialDrinks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Zap size={14} className="text-yellow-500" />
              <span>Snel Toevoegen</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {speedDialDrinks.map((drink, idx) => (
                <motion.button
                  key={`speed-${idx}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddLog(drink)}
                  className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl shadow-lg hover:border-cyan-500/30 transition-colors"
                >
                  <span className="text-3xl mb-2">{drink.icon}</span>
                  <span className="text-xs font-bold text-slate-300 truncate w-full text-center">{drink.name}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Categories Tabs */}
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === 'all' 
                  ? 'bg-white text-slate-900 shadow-lg shadow-white/10' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              Alles
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id 
                    ? 'bg-white text-slate-900 shadow-lg shadow-white/10' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filteredDrinks.map((drink, idx) => (
            <motion.button
              key={`${drink.id}-${idx}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAddLog(drink)}
              className="aspect-square flex flex-col items-center justify-center p-2 bg-slate-900/50 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-slate-700 transition-colors"
            >
              <span className="text-3xl mb-2 filter drop-shadow-md">{drink.icon}</span>
              <span className="text-[10px] font-medium text-slate-400 text-center leading-tight line-clamp-2">{drink.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Recent History (Mini) */}
        <section className="pt-8 border-t border-slate-800/50">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <History size={14} />
            <span>Recente Activiteit</span>
          </div>
          <div className="space-y-2">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{log.icon}</span>
                  <span className="text-sm font-medium text-slate-300">{log.drink_name}</span>
                </div>
                <button 
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Drankjes Beheren">
        <div className="space-y-8">
          {/* Add Category */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Nieuwe Categorie</h3>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
                placeholder="Categorie Naam"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-xl">
                <Plus size={20} />
              </button>
            </form>
          </section>

          {/* Manage Categories & Drinks */}
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-200">{cat.name}</h4>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-400 text-xs font-bold">VERWIJDEREN</button>
                </div>

                {/* Drinks List */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {cat.drinks?.map(drink => (
                    <div key={drink.id} className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs">
                      <span>{drink.icon} {drink.name}</span>
                      <button onClick={() => handleDeleteDrinkType(cat.id, drink)} className="text-slate-500 hover:text-red-400 ml-1">×</button>
                    </div>
                  ))}
                </div>

                {/* Add Drink Form */}
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-500/50"
                    placeholder="Drank Naam"
                    value={settingsCatId === cat.id ? newDrinkName : ''}
                    onChange={e => { setSettingsCatId(cat.id); setNewDrinkName(e.target.value); }}
                  />
                  <input 
                    className="w-10 bg-slate-900 border border-slate-800 rounded-lg px-1 py-1.5 text-center text-xs outline-none focus:border-cyan-500/50"
                    placeholder="🍺"
                    value={settingsCatId === cat.id ? newDrinkIcon : '🍺'}
                    onChange={e => { setSettingsCatId(cat.id); setNewDrinkIcon(e.target.value); }}
                  />
                  <button 
                    onClick={(e) => { setSettingsCatId(cat.id); handleAddDrinkType(e); }}
                    className="bg-slate-800 hover:bg-slate-700 px-3 rounded-lg text-xs font-bold"
                  >
                    Toevoegen
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Seed Database */}
          <section className="pt-4 border-t border-slate-800">
            <button 
              onClick={handleSeedDatabase}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-colors"
            >
              🌱 Database vullen met standaardwaarden
            </button>
          </section>
        </div>
      </Modal>
    </div>
  );
}
