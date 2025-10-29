
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
  type Firestore,
} from "firebase/firestore";

const DEFAULT_FOLDERS = ["Circular","Formato","Guía","Instructivo","Manual","Política","Programa","Planes","Plantilla","Procedimiento","Protocolo"];

export async function getOrCreateRootFolder(
    firestore: Firestore,
    { areaId, procesoId = null, subprocesoId = null }: { areaId: string; procesoId?: string | null; subprocesoId?: string | null }
) {
  const foldersRef = collection(firestore, "folders");
  const q = query(
    foldersRef,
    where("areaId", "==", areaId),
    where("procesoId", "==", procesoId),
    where("subprocesoId", "==", subprocesoId),
    where("parentId", "==", null),
    limit(1)
  );

  const snap = await getDocs(q);
  if (!snap.empty) {
    const rootDoc = snap.docs[0];
    return { id: rootDoc.id, ...rootDoc.data() };
  };

  const batch = writeBatch(firestore);

  const rootRef = doc(foldersRef);
  batch.set(rootRef, {
    name: "Documentación",
    areaId,
    procesoId,
    subprocesoId,
    parentId: null,
    createdAt: serverTimestamp()
  });

  DEFAULT_FOLDERS.forEach(name => {
    const subFolderRef = doc(foldersRef);
    batch.set(subFolderRef, {
      name,
      parentId: rootRef.id,
      areaId,
      procesoId,
      subprocesoId,
      createdAt: serverTimestamp()
    });
  });

  await batch.commit();

  return { id: rootRef.id, name: "Documentación", parentId: null, areaId, procesoId, subprocesoId };
}
