'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Category, DrinkType, Log } from '@/types';
import { generateUUID } from '@/utils/uuid';
import Toast from './_components/Toast';
import ConfirmationModal from './_components/ConfirmationModal';
import FullScreenSpinner from './_components/FullScreenSpinner';
import DashboardSkeleton from './_components/DashboardSkeleton';
import DashboardHeader from './_components/DashboardHeader';
import CategoryFilter from './_components/CategoryFilter';
import RecentActivity from './_components/RecentActivity';
import DrinkGrid from './_components/DrinkGrid';
import StatsCards from './_components/StatsCards';

const SettingsModal = dynamic(() => import('./_components/SettingsModal'), { ssr: false });

export default function DashboardClient() {
  const { user, loading: authLoading, isAdmin, adminLoading, signOut } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);

  const [mobileTab, setMobileTab] = useState<'drinks' | 'history'>('drinks');

  const [logsLoaded, setLogsLoaded] = useState(false);
  const [catsLoaded, setCatsLoaded] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!authLoading && !adminLoading && !user) {
      router.push('/admin');
    }
  }, [user, authLoading, adminLoading, router]);

  useEffect(() => {
    if (!user) return;

    setLogsLoaded(false);
    setCatsLoaded(false);

    const unsubLogs = onSnapshot(
      query(collection(db, 'logs'), orderBy('created_at', 'desc'), limit(1000)),
      (snap) => {
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Log)));
        setLogsLoaded(true);
      },
    );

    const unsubCats = onSnapshot(query(collection(db, 'categories')), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
      setCatsLoaded(true);
    });

    return () => {
      unsubLogs();
      unsubCats();
    };
  }, [user]);

  const { todayCount, totalCount } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      todayCount: logs.filter((l) => l.created_at?.toDate() >= todayStart).length,
      totalCount: logs.length,
    };
  }, [logs]);

  const formatLogDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Vandaag ${timeStr}`;
    if (isYesterday) return `Gisteren ${timeStr}`;
    return `${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} ${timeStr}`;
  };

  const speedDialDrinks = useMemo(() => {
    const counts: Record<string, { count: number; drink: DrinkType }> = {};

    logs.forEach((log) => {
      const key = `${log.drink_name}-${log.icon}`;
      if (!counts[key]) {
        counts[key] = {
          count: 0,
          drink: { id: 'speed-dial', name: log.drink_name, icon: log.icon },
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map((item) => item.drink);
  }, [logs]);

  const filteredDrinks = useMemo(() => {
    const allDrinks: (DrinkType & { categoryId: string })[] = [];
    categories.forEach((cat) => {
      cat.drinks?.forEach((drink) => {
        allDrinks.push({ ...drink, categoryId: cat.id });
      });
    });

    if (searchQuery) {
      return allDrinks.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedCategoryId === 'all') return allDrinks;

    return allDrinks.filter((d) => d.categoryId === selectedCategoryId);
  }, [categories, selectedCategoryId, searchQuery]);

  const handleAddLog = async (drink: DrinkType, uniqueId: string) => {
    if (addingId) return;
    setAddingId(uniqueId);
    try {
      await addDoc(collection(db, 'logs'), {
        drink_name: drink.name,
        icon: drink.icon,
        created_at: serverTimestamp(),
        reactions: {},
      });
      setToastMessage(`${drink.name} toegevoegd! 🚀`);
    } catch (error: any) {
      console.error(error);
      if (error?.code === 'permission-denied') {
        setToastMessage('Geen toegang (admin nodig).');
      } else {
        setToastMessage('Fout bij toevoegen');
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleDeleteLog = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Logboek Verwijderen',
      message: 'Weet je zeker dat je dit logboek wilt verwijderen?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'logs', id));
        } catch (error: any) {
          console.error(error);
          if (error?.code === 'permission-denied') {
            setToastMessage('Geen toegang (admin nodig).');
          }
        }
      },
    });
  };

  const handleDeleteCategory = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Categorie Verwijderen',
      message: 'Weet je zeker dat je deze categorie wilt verwijderen?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'categories', id));
        } catch (error: any) {
          console.error(error);
          if (error?.code === 'permission-denied') {
            setToastMessage('Geen toegang (admin nodig).');
          }
        }
      },
    });
  };

  const handleDeleteDrinkType = async (catId: string, drink: DrinkType) => {
    setConfirmModal({
      isOpen: true,
      title: 'Drankje Verwijderen',
      message: `Weet je zeker dat je ${drink.name} wilt verwijderen?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, 'categories', catId), { drinks: arrayRemove(drink) });
        } catch (error: any) {
          console.error(error);
          if (error?.code === 'permission-denied') {
            setToastMessage('Geen toegang (admin nodig).');
          }
        }
      },
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
            ],
          },
          {
            name: 'Non-Alcoholisch',
            drinks: [
              { id: 'na-1', name: 'Fris', icon: '🥤' },
              { id: 'na-2', name: 'Water', icon: '💧' },
              { id: 'na-3', name: 'Koffie', icon: '☕' },
              { id: 'na-4', name: 'Thee', icon: '🍵' },
            ],
          },
        ];

        try {
          for (const cat of SEED_DATA) {
            await addDoc(collection(db, 'categories'), {
              name: cat.name,
              drinks: cat.drinks,
            });
          }
          setToastMessage('Database gevuld! 🌱');
        } catch (error) {
          console.error(error);
          setToastMessage('Fout bij vullen database');
        }
      },
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (authLoading || adminLoading) {
    return <FullScreenSpinner label="Account controleren…" />;
  }

  if (!user) {
    return <FullScreenSpinner label="Doorsturen…" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-black tracking-tight mb-2">Geen toegang</h1>
          <p className="text-slate-400 text-sm mb-6">
            Je bent ingelogd, maar dit account heeft geen admin-rechten.
          </p>
          <button
            onClick={async () => {
              await signOut();
              router.push('/admin');
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  const isDataLoading = !logsLoaded || !catsLoaded;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <DashboardHeader
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        onSearchActiveChange={setSearchActive}
      />

      <div
        className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-200 z-30 ${
          searchActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <main className="relative max-w-7xl mx-auto px-4 lg:px-6 pb-4 space-y-8">
        {isDataLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {!searchQuery && <StatsCards todayCount={todayCount} totalCount={totalCount} />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div
                className={`space-y-6 ${
                  historyOpen ? 'lg:col-span-8' : 'lg:col-span-12'
                } ${mobileTab === 'history' ? 'hidden lg:block' : ''}`}
              >
                <section className="rounded-3xl bg-white/5 border border-white/10 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[11px] font-black tracking-[0.22em] uppercase text-slate-300">Drink Library</p>
                      <h2 className="text-2xl font-black text-white tracking-tight">Alles om direct te loggen</h2>
                    </div>
                    {!searchQuery && speedDialDrinks.length ? (
                      <div className="text-xs font-semibold text-slate-400">Aanraders uit jouw historie</div>
                    ) : null}
                  </div>

                  <DrinkGrid
                    drinks={filteredDrinks}
                    featuredDrinks={!searchQuery ? speedDialDrinks : []}
                    addingId={addingId}
                    onAddLog={handleAddLog}
                  />
                </section>
              </div>

              <div
                className={`lg:col-span-4 space-y-6 transition-all duration-200 ${
                  historyOpen ? 'lg:translate-x-0' : 'lg:-translate-x-4 lg:opacity-0 lg:pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between lg:hidden">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((v) => !v)}
                    className="text-xs text-slate-300 underline"
                  >
                    {historyOpen ? 'Verberg geschiedenis' : 'Toon geschiedenis'}
                  </button>
                </div>

                {!searchQuery && (
                  <CategoryFilter
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategoryId={setSelectedCategoryId}
                  />
                )}

                <RecentActivity
                  logs={logs}
                  onDeleteLog={handleDeleteLog}
                  formatLogDate={formatLogDate}
                  limit={12}
                  variant="desktop"
                  onToggle={() => setHistoryOpen((v) => !v)}
                  open={historyOpen}
                />
              </div>
            </div>

            <div className={mobileTab === 'drinks' ? 'hidden lg:hidden' : 'lg:hidden'}>
              <RecentActivity
                logs={logs}
                onDeleteLog={handleDeleteLog}
                formatLogDate={formatLogDate}
                limit={20}
                variant="mobile"
                onToggle={() => setHistoryOpen((v) => !v)}
                open={historyOpen}
              />
            </div>
          </>
        )}
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        categories={categories}
        onAddCategory={async (name) => {
          await addDoc(collection(db, 'categories'), { name, drinks: [] });
        }}
        onDeleteCategory={async (categoryId) => {
          await handleDeleteCategory(categoryId);
        }}
        onAddDrinkType={async (categoryId, drinkName, drinkIcon) => {
          const newDrink: DrinkType = { id: generateUUID(), name: drinkName, icon: drinkIcon };
          await updateDoc(doc(db, 'categories', categoryId), { drinks: arrayUnion(newDrink) });
        }}
        onDeleteDrinkType={async (categoryId, drink) => {
          await handleDeleteDrinkType(categoryId, drink);
        }}
        onSeedDatabase={async () => {
          await handleSeedDatabase();
        }}
      />
    </div>
  );
}
