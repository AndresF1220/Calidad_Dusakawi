
'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  type Query,
  type DocumentData,
} from 'firebase/firestore';

export type UseCollectionState = {
  data: DocumentData[] | null;
  isLoading: boolean;
  error: Error | null;
};

export function useCollection(query: Query | null): UseCollectionState {
  const [state, setState] = useState<UseCollectionState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!query) {
      setState({ data: [], isLoading: false, error: null });
      return;
    }

    setState((prevState) => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    const unsubscribe = onSnapshot(
      query,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setState({ data, isLoading: false, error: null });
      },
      (error) => {
        console.error('Error fetching collection:', error);
        setState({ data: null, isLoading: false, error });
      }
    );

    return () => unsubscribe();
  }, [query]);

  return state;
}
