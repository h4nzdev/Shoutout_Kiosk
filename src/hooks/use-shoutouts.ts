'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shoutout } from '@/lib/types';
import { useToast } from './use-toast';

const SHOUTOUTS_KEY = 'ccs-valentine-shoutouts';
const TTL = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

export function useShoutouts() {
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  const getShoutoutsFromStorage = useCallback((): Shoutout[] => {
    try {
      const item = window.localStorage.getItem(SHOUTOUTS_KEY);
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error('Failed to parse shoutouts from localStorage', error);
      return [];
    }
  }, []);

  const saveShoutoutsToStorage = useCallback((shoutoutsToSave: Shoutout[]) => {
    try {
      window.localStorage.setItem(SHOUTOUTS_KEY, JSON.stringify(shoutoutsToSave));
      // Dispatch a custom event to notify other tabs/windows
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Failed to save shoutouts to localStorage', error);
    }
  }, []);

  const purgeExpiredShoutouts = useCallback(() => {
    const allShoutouts = getShoutoutsFromStorage();
    const now = Date.now();
    const validShoutouts = allShoutouts.filter(s => (now - s.createdAt) < TTL);
    
    if (validShoutouts.length < allShoutouts.length) {
      saveShoutoutsToStorage(validShoutouts);
      setShoutouts(validShoutouts);
      toast({
        title: "Feed Cleaned",
        description: "Some old shoutouts have been cleared.",
      });
    }
  }, [getShoutoutsFromStorage, saveShoutoutsToStorage, toast]);

  useEffect(() => {
    const currentShoutouts = getShoutoutsFromStorage();
    const now = Date.now();
    const validShoutouts = currentShoutouts.filter(s => (now - s.createdAt) < TTL);
    
    setShoutouts(validShoutouts);
    if(validShoutouts.length < currentShoutouts.length){
        saveShoutoutsToStorage(validShoutouts);
    }
    setInitialized(true);
    
    // Set up a periodic check to purge expired shoutouts
    const intervalId = setInterval(purgeExpiredShoutouts, 60 * 1000); // Check every minute

    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
        setShoutouts(getShoutoutsFromStorage());
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [getShoutoutsFromStorage, saveShoutoutsToStorage, purgeExpiredShoutouts]);
  
  const addShoutout = useCallback((newShoutoutData: Omit<Shoutout, 'id' | 'createdAt'>) => {
    const newShoutout: Shoutout = {
      ...newShoutoutData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    setShoutouts(prevShoutouts => {
      const updatedShoutouts = [newShoutout, ...prevShoutouts];
      saveShoutoutsToStorage(updatedShoutouts);
      return updatedShoutouts;
    });
  }, [saveShoutoutsToStorage]);

  return { shoutouts, addShoutout, initialized };
}
