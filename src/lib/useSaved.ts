import Storage from 'expo-sqlite/kv-store';
import { useCallback, useMemo, useRef, useState } from 'react';
import { conventionsById } from '../data/conventions';
import { parseSaved, toggleSaved } from './saved';

const KEY = 'saved-conventions:v1';

function load(): number[] {
  try {
    return parseSaved(Storage.getItemSync(KEY), (id) => conventionsById.has(id));
  } catch {
    return [];
  }
}

/** Saved conventions, kept on the device. Synchronous read, so there's no loading flash. */
export function useSaved() {
  const [ids, setIds] = useState<number[]>(load);
  const latest = useRef(ids);

  const toggle = useCallback((id: number) => {
    const next = toggleSaved(latest.current, id);
    latest.current = next;
    setIds(next);
    try {
      Storage.setItemSync(KEY, JSON.stringify(next));
    } catch {
      // Storage failed: the save still works for this session.
    }
  }, []);

  const savedSet = useMemo(() => new Set(ids), [ids]);
  return { ids, savedSet, toggle };
}
