// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { localStorageService } from '@/services/localStorage';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = localStorageService.getValue<T>(key);
    return item ?? initialValue;
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    localStorageService.setValue(key, valueToStore);
  };

  // Optional: Listen for changes from other tabs/windows
  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      if (event.key === `npp.${key}` && event.newValue) {
        setStoredValue(JSON.parse(event.newValue));
      }
    },
    [key]
  );

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);


  return [storedValue, setValue];
}
