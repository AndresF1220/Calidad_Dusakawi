
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User, type Auth } from 'firebase/auth';

export type UserState =
  | {
      status: 'unauthenticated';
      user: null;
    }
  | {
      status: 'authenticated';
      user: User;
    }
  | {
      status: 'loading';
      user: null;
    };

export function useUser(auth: Auth | null): UserState {
  const [userState, setUserState] = useState<UserState>({
    status: 'loading',
    user: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserState({ status: 'unauthenticated', user: null });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserState({ status: 'authenticated', user });
      } else {
        setUserState({ status: 'unauthenticated', user: null });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  return userState;
}
