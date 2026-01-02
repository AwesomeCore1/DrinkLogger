import { Timestamp } from 'firebase/firestore';

export interface Log {
  id: string;
  drink_name: string;
  icon: string;
  category_id?: string;
  notes?: string;
  created_at: Timestamp;
  reactions: Record<string, string[]>; // emoji -> array of userIds
}

export interface DrinkType {
  id: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  drinks: DrinkType[];
}
