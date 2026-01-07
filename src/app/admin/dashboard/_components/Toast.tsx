'use client';

import { useEffect } from 'react';

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-slate-900 rounded-full shadow-2xl z-50 font-bold flex items-center gap-2 whitespace-nowrap">
      {message}
    </div>
  );
}
