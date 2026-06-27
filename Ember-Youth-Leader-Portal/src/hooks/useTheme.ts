import { useState, useEffect, useCallback } from 'react';
import api from '../api';

type ThemePreference = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'rg_leader_theme';

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(pref: ThemePreference): 'dark' | 'light' {
  return pref === 'system' ? getSystemTheme() : pref;
}

function applyTheme(resolved: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', resolved);
}

export function useTheme(initialPreference?: ThemePreference) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return stored || initialPreference || 'light';
  });

  // Apply theme on mount and when preference changes
  useEffect(() => {
    const resolved = resolveTheme(preference);
    applyTheme(resolved);
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  // Listen to OS preference changes when in 'system' mode
  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      applyTheme(getSystemTheme());
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  // Sync to backend (fire-and-forget)
  const syncToBackend = useCallback((pref: ThemePreference) => {
    api.updateProfile({ themePreference: pref }).catch(() => {
      // Silently fail — localStorage is the source of truth
    });
  }, []);

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref);
    syncToBackend(pref);
  }, [syncToBackend]);

  return { theme: preference, setTheme, resolvedTheme: resolveTheme(preference) };
}

export default useTheme;
