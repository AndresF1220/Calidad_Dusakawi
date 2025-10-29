
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  writeBatch,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

interface EnsureRepoRootsParams {
  firestore: Firestore;
  areaId: string;
  procesoId?: string | null;
  subprocesoId?: string | null;
}

const SUBFOLDER_NAMES = [
  "Circular",
  "Formato",
  "Guía",
  "Instructivo",
  "Manual",
  "Política",
  "Programa",
  "Planes",
  "Plantilla",
  "Procedimiento",
  "Protocolo",
];

export async function ensureRepoRoots({
  firestore,
  areaId,
  procesoId,
  subprocesoId,
}: EnsureRepoRootsParams): Promise<string> {
  const foldersRef = collection(firestore, 'folders');

  const q = query(
    foldersRef,
    where('areaId', '==', areaId),
    where('procesoId', '==', procesoId ?? null),
    where('subprocesoId', '==', subprocesoId ?? null),
    where('parentId', '==', null)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Root folder does not exist, create it
    const rootFolderData = {
      name: 'Documentación',
      areaId: areaId,
      procesoId: procesoId ?? null,
      subprocesoId: subprocesoId ?? null,
      parentId: null,
      createdAt: serverTimestamp(),
    };
    const rootFolderRef = await addDoc(foldersRef, rootFolderData);

    // Create subfolders in a batch
    const batch = writeBatch(firestore);
    SUBFOLDER_NAMES.forEach(name => {
      const subFolderData = {
        name: name,
        areaId: areaId,
        procesoId: procesoId ?? null,
        subprocesoId: subprocesoId ?? null,
        parentId: rootFolderRef.id,
        createdAt: serverTimestamp(),
      };
      const subFolderRef = doc(collection(firestore, 'folders'));
      batch.set(subFolderRef, subFolderData);
    });

    await batch.commit();
    return rootFolderRef.id;
  } else {
    // Root folder already exists, return its ID
    return querySnapshot.docs[0].id;
  }
}

    