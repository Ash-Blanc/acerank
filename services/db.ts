
import { UserState, StudySession, TopicMastery, AgentLog, StudyMaterial } from '../types';

const DB_NAME = 'AceRankDB';
const DB_VERSION = 2; // Incremented for materials store

interface AceRankSchema {
  user: UserState;
  sessions: StudySession;
  mastery: TopicMastery;
  logs: AgentLog;
  materials: StudyMaterial;
}

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // User Store (Single Object)
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'id' });
        }
        
        // Sessions Store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('startTime', 'startTime', { unique: false });
          sessionStore.createIndex('subject', 'subject', { unique: false });
        }
        
        // Topic Mastery Store
        if (!db.objectStoreNames.contains('mastery')) {
          const masteryStore = db.createObjectStore('mastery', { keyPath: 'topicId' });
          masteryStore.createIndex('nextReviewDue', 'nextReviewDue', { unique: false });
        }

        // Agent Logs
        if (!db.objectStoreNames.contains('logs')) {
           db.createObjectStore('logs', { keyPath: 'id' });
        }

        // NEW: Study Materials Store
        if (!db.objectStoreNames.contains('materials')) {
           const materialStore = db.createObjectStore('materials', { keyPath: 'id' });
           materialStore.createIndex('subject', 'subject', { unique: false });
           materialStore.createIndex('type', 'type', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  // --- Generic Helpers ---

  private getTransaction(storeName: string, mode: IDBTransactionMode) {
    if (!this.db) throw new Error("DB not initialized");
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  // --- User Methods ---

  async saveUser(user: UserState): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('user', 'readwrite');
      const request = store.put({ ...user, id: 'current_user' });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUser(): Promise<UserState | null> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('user', 'readonly');
      const request = store.get('current_user');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Session Methods ---

  async saveSession(session: StudySession): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('sessions', 'readwrite');
      const request = store.add(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSessions(): Promise<StudySession[]> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('sessions', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Mastery Methods ---

  async updateMastery(topic: TopicMastery): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('mastery', 'readwrite');
      const request = store.put(topic);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMastery(): Promise<TopicMastery[]> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('mastery', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- Material Methods ---

  async saveMaterial(material: StudyMaterial): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('materials', 'readwrite');
      const request = store.put(material);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMaterials(): Promise<StudyMaterial[]> {
    return new Promise((resolve, reject) => {
      try {
        const store = this.getTransaction('materials', 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (e) {
        // Fallback for previous version
        resolve([]);
      }
    });
  }

  async deleteMaterial(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction('materials', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
