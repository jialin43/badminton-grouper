import { useEffect, useReducer, useState } from 'react';
import { appReducer, createInitialState } from './reducer';
import type { AppAction } from './reducer';
import type { AppState } from '../types';
import { clearSavedState, loadState, saveState } from '../lib/storage';

interface Bootstrap {
  state: AppState;
  restoredAt: number | null;
}

function bootstrap(): Bootstrap {
  const saved = loadState();
  if (!saved) {
    return { state: createInitialState(), restoredAt: null };
  }

  const meaningful =
    saved.players.length > 0 ||
    saved.rawText.trim().length > 0 ||
    saved.groups.length > 0;

  return {
    state: saved,
    restoredAt: meaningful ? saved.updatedAt : null,
  };
}

export function useAppState() {
  const [initial] = useState<Bootstrap>(bootstrap);
  const [state, dispatch] = useReducer(appReducer, initial.state);
  const [restoredVisible, setRestoredVisible] = useState(
    initial.restoredAt !== null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => saveState(state), 300);
    return () => window.clearTimeout(timer);
  }, [state]);

  const dismissRestore = () => setRestoredVisible(false);

  const reset = () => {
    clearSavedState();
    dispatch({ type: 'RESET' });
    setRestoredVisible(false);
  };

  return {
    state,
    dispatch: dispatch as (action: AppAction) => void,
    restoredAt: restoredVisible ? initial.restoredAt : null,
    dismissRestore,
    reset,
  };
}
