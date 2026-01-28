import { safeLogger } from '@/lib/logging/safeLogger';

class MemoryStorage {
    private store: Record<string, string> = {};

    getItem(key: string): string | null {
        return this.store[key] || null;
    }

    setItem(key: string, value: string): void {
        this.store[key] = value;
    }

    removeItem(key: string): void {
        delete this.store[key];
    }
}

const memoryStore = new MemoryStorage();
let isSupported = true;

// Feature detection for localStorage
try {
    const testKey = '__test_storage__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
} catch (e) {
    safeLogger.warn('storage.local_storage_unavailable', { error: (e as Error).message });
    isSupported = false;
}

export const safeLocalStorage = {
    getItem: (key: string): string | null => {
        if (!isSupported) return memoryStore.getItem(key);
        try {
            return localStorage.getItem(key);
        } catch (e) {
            safeLogger.error('storage.get_item_failed', { key });
            return memoryStore.getItem(key);
        }
    },
    setItem: (key: string, value: string): void => {
        if (!isSupported) {
            memoryStore.setItem(key, value);
            return;
        }
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // QuotaExceededError or SecurityError
            safeLogger.error('storage.set_item_failed', { key });
            // Fallback to memory so the session survives at least in this tab
            memoryStore.setItem(key, value);
        }
    },
    removeItem: (key: string): void => {
        if (!isSupported) {
            memoryStore.removeItem(key);
            return;
        }
        try {
            localStorage.removeItem(key);
        } catch (e) {
            safeLogger.error('storage.remove_item_failed', { key });
            memoryStore.removeItem(key);
        }
    }
};
