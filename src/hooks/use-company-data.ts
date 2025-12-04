import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

interface CompanyData {
  name: string;
}

export function useCompanyData() {
  const { firestore } = useFirebase();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) {
      return;
    }

    const docRef = doc(firestore, 'settings', 'company');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CompanyData;
          setCompanyName(data.name);
        } else {
          setCompanyName(null);
        }
        setLoading(false);
      },
      (error: any) => {
        if (error.code === 'permission-denied') {
          setCompanyName(null);
          setLoading(false);
        } else {
          console.error("Error fetching company data:", error);
          setCompanyName(null);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  return { companyName, loading };
}
