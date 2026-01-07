import { initializeApp, getApps } from "firebase/app";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCqTq_FQJ5_CXuic_ixr7m8ZkD4K7mkMtg",
  authDomain: "drinklogger-36574214.firebaseapp.com",
  projectId: "drinklogger-36574214",
  storageBucket: "drinklogger-36574214.firebasestorage.app",
  messagingSenderId: "1059737587186",
  appId: "1:1059737587186:web:18252280ab6ed2b5146f6b"
};

// Initialize Firebase (prevent re-initialization during hot-reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence for faster repeat loads and instant rendering.
// Safe to call in the browser only; ignore failures (multi-tab, private mode, etc.).
if (typeof window !== 'undefined') {
  const g = globalThis as unknown as { __DRINKLOGGER_PERSISTENCE__?: boolean };
  if (!g.__DRINKLOGGER_PERSISTENCE__) {
    g.__DRINKLOGGER_PERSISTENCE__ = true;
    enableIndexedDbPersistence(db).catch(() => {
      // Intentionally ignored.
    });
  }
}