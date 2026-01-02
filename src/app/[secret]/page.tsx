"use client";
import { useState } from 'react';
import { collection, addDoc, Timestamp } from "firebase/firestore"; 
import { db } from '@/firebase/config';

const PRESETS = [
  { name: 'Bier', icon: '🍺' },
  { name: 'Wijn', icon: '🍷' },
  { name: 'Cocktail', icon: '🍹' },
  { name: 'Shot', icon: '🥃' },
  { name: 'Whisky', icon: '🥃' },
  { name: 'Mix', icon: '🥤' },
];

export default function AdminPanel({ params }: { params: { secret: string } }) {
  const [loading, setLoading] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [status, setStatus] = useState('');
  
  // 1. SECURITY CHECK (Client side for simplicity)
  // Ensure NEXT_PUBLIC_ADMIN_SECRET is set in your .env.local
  if (params.secret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return <div className="h-screen bg-slate-950 text-slate-600 flex items-center justify-center font-mono">403 - ACCESS DENIED</div>;
  }

  const addDrink = async (name: string, icon: string) => {
    if (loading) return;
    setLoading(true);
    setStatus('Toevoegen...');

    try {
      // 2. WRITE TO FIREBASE
      await addDoc(collection(db, "logs"), {
        drink_name: name,
        icon: icon,
        notes: customNote,
        created_at: Timestamp.now()
      });

      // Success Feedback
      setCustomNote(''); 
      setStatus('✅ Opgeslagen!');
      if (navigator.vibrate) navigator.vibrate(50);
      
      setTimeout(() => setStatus(''), 2000);

    } catch (e) {
      console.error("Error adding document: ", e);
      setStatus('❌ Fout bij opslaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center max-w-md mx-auto font-sans">
      <div className="w-full mb-8 text-center">
         <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
          QUICK ADD
        </h1>
        <p className="text-slate-500 text-sm mt-1">Selecteer een consumptie</p>
      </div>

      {/* Optional Note Input */}
      <div className="w-full relative mb-6">
        <input
          type="text"
          placeholder="Notitie (optioneel)"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl p-4 pl-4 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      {/* Grid of Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        {PRESETS.map((drink) => (
          <button
            key={drink.name}
            disabled={loading}
            onClick={() => addDrink(drink.name, drink.icon)}
            className="group relative overflow-hidden flex flex-col items-center justify-center p-6 bg-slate-900 hover:bg-slate-800 active:bg-sky-900/40 rounded-2xl border border-slate-800 transition-all duration-100 transform active:scale-95 touch-manipulation"
          >
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">{drink.icon}</span>
            <span className="font-bold text-slate-300 group-hover:text-white">{drink.name}</span>
          </button>
        ))}
      </div>

      {/* Status Bar */}
      <div className="h-8 flex items-center justify-center">
        {status && (
          <span className={`text-sm font-medium ${status.includes('❌') ? 'text-red-400' : 'text-green-400'} animate-fade-in`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
