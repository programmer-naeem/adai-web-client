import { seedDatabase, type AppDatabase } from "@/lib/api/mock/seed";

const STORAGE_KEY = "aadai.mock.db.v1";

let memory: AppDatabase | null = null;

function canUseStorage(): boolean {
  return typeof localStorage !== "undefined" && !process.env.VITEST;
}

export function persistDb(): void {
  if (!memory || !canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function getDb(): AppDatabase {
  if (memory) return memory;
  if (canUseStorage()) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        memory = JSON.parse(raw) as AppDatabase;
        return memory;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
  memory = seedDatabase();
  persistDb();
  return memory;
}

export function resetDb(): AppDatabase {
  if (canUseStorage()) localStorage.removeItem(STORAGE_KEY);
  memory = seedDatabase();
  persistDb();
  return memory;
}

export async function withDb<T>(work: (db: AppDatabase) => T): Promise<T> {
  const result = work(getDb());
  persistDb();
  if (!process.env.VITEST) {
    const ms = 220 + Math.floor(Math.random() * 160);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  return result;
}
