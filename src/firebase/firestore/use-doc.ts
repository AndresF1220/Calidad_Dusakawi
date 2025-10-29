
'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  type DocumentReference,
  type DocumentData,
} from 'firebase/firestore';

export type UseDocState = {
  data: DocumentData | null;
  isLoading: boolean;
  error: Error | null;
};

export function useDoc(ref: DocumentReference | null): UseDocState {
  const [state, setState] = useState<UseDocState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!ref) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    
    setState((prevState) => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    const unsubscribe = onSnapshot(
      ref,
      (docSnap) => {
        if (docSnap.exists()) {
          setState({
            data: { id: docSnap.id, ...docSnap.data() },
            isLoading: false,
            error: null,
          });
        } else {
           setState({ data: null, isLoading: false, error: null });
        }
      },
      (error) => {
        console.error('Error fetching document:', error);
        setState({ data: null, isLoading: false, error });
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return state;
}
