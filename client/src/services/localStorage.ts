// src/services/localStorage.ts

const NAMESPACE = 'npp';
const DATA_VERSION = '1.0';
const QUOTA_EXCEEDED_WARNING_THRESHOLD = 80; // 80%

class LocalStorageService {
  private listeners: ((usage: number) => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Perform any initial setup, like data versioning checks
    this.checkVersion();
  }

  private getNamespacedKey(key: string): string {
    return `${NAMESPACE}.${key}`;
  }

  private checkVersion() {
    const versionKey = 'data-version';
    const storedVersion = this.getValue<string>(versionKey);
    if (storedVersion !== DATA_VERSION) {
      // For now, our migration strategy is to clear old data.
      // More sophisticated migration logic can be added here in the future.
      this.clearAll();
      this.setValue(versionKey, DATA_VERSION);
    }
  }

  private isQuotaExceededError(e: any): boolean {
    return (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  getValue<T>(key: string): T | null {
    try {
      const item = window.localStorage.getItem(this.getNamespacedKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting value for key "${key}" from localStorage`, error);
      return null;
    }
  }

  setValue<T>(key: string, value: T): void {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const stringValue = JSON.stringify(value);
      window.localStorage.setItem(namespacedKey, stringValue);
      this.checkQuota();
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        this.notifyQuotaExceeded();
      } else {
        console.error(`Error setting value for key "${key}" in localStorage`, error);
      }
    }
  }

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(this.getNamespacedKey(key));
    } catch (error) {
      console.error(`Error removing key "${key}" from localStorage`, error);
    }
  }

  clearAll(): void {
    try {
      // Iterate backwards to safely remove items
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(`${NAMESPACE}.`) && !key.endsWith('.data-version')) {
          window.localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing all namespaced data from localStorage', error);
    }
  }

  private checkQuota(): void {
    const usage = this.getUsagePercentage();
    if (usage >= QUOTA_EXCEEDED_WARNING_THRESHOLD) {
      this.notifyQuotaExceeded(usage);
    }
  }

  private notifyQuotaExceeded(usage?: number): void {
    const currentUsage = usage ?? this.getUsagePercentage();
    this.listeners.forEach(callback => callback(currentUsage));
  }

  getUsagePercentage(): number {
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        const value = window.localStorage.getItem(key);
        if (value) {
          total += new Blob([key, value]).size;
        }
      }
    }
    // Estimate total localStorage capacity to be 5MB
    const totalCapacity = 5 * 1024 * 1024;
    return (total / totalCapacity) * 100;
  }

  onQuotaExceeded(callback: (usage: number) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
}

export const localStorageService = new LocalStorageService();
