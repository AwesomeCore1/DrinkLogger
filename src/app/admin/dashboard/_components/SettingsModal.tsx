'use client';

import React, { useState } from 'react';
import { Category, DrinkType } from '@/types';
import { Plus, X } from 'lucide-react';

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md p-4 border-b border-slate-800 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function SettingsModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  onAddDrinkType,
  onDeleteDrinkType,
  onSeedDatabase,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onAddDrinkType: (categoryId: string, drinkName: string, drinkIcon: string) => Promise<void>;
  onDeleteDrinkType: (categoryId: string, drink: DrinkType) => Promise<void>;
  onSeedDatabase: () => Promise<void>;
}) {
  const [newCategoryName, setNewCategoryName] = useState('');

  const [activeCatId, setActiveCatId] = useState<string>('');
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkIcon, setNewDrinkIcon] = useState('🍺');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Drankjes Beheren">
      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Nieuwe Categorie</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCategoryName.trim()) return;
              await onAddCategory(newCategoryName.trim());
              setNewCategoryName('');
            }}
            className="flex gap-2"
          >
            <input
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
              placeholder="Categorie Naam"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 rounded-xl" aria-label="Categorie toevoegen">
              <Plus size={20} />
            </button>
          </form>
        </section>

        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-200">{cat.name}</h4>
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  className="text-red-500 hover:text-red-400 text-xs font-bold"
                >
                  VERWIJDEREN
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {cat.drinks?.map((drink) => (
                  <div
                    key={drink.id}
                    className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-xs"
                  >
                    <span>
                      {drink.icon} {drink.name}
                    </span>
                    <button
                      onClick={() => onDeleteDrinkType(cat.id, drink)}
                      className="text-slate-500 hover:text-red-400 ml-1"
                      aria-label={`Verwijder ${drink.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-500/50"
                  placeholder="Drank Naam"
                  value={activeCatId === cat.id ? newDrinkName : ''}
                  onChange={(e) => {
                    setActiveCatId(cat.id);
                    setNewDrinkName(e.target.value);
                  }}
                />
                <input
                  className="w-10 bg-slate-900 border border-slate-800 rounded-lg px-1 py-1.5 text-center text-xs outline-none focus:border-cyan-500/50"
                  placeholder="🍺"
                  value={activeCatId === cat.id ? newDrinkIcon : '🍺'}
                  onChange={(e) => {
                    setActiveCatId(cat.id);
                    setNewDrinkIcon(e.target.value);
                  }}
                />
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    const catId = cat.id;
                    setActiveCatId(catId);
                    if (!newDrinkName.trim()) return;
                    await onAddDrinkType(catId, newDrinkName.trim(), (newDrinkIcon || '🍺').trim());
                    setNewDrinkName('');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 px-3 rounded-lg text-xs font-bold"
                >
                  Toevoegen
                </button>
              </div>
            </div>
          ))}
        </div>

        <section className="pt-4 border-t border-slate-800">
          <button
            onClick={onSeedDatabase}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-colors"
          >
            🌱 Database vullen met standaardwaarden
          </button>
        </section>
      </div>
    </Modal>
  );
}
