
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";

const DEFAULT_FOLDERS = ["Circular","Formato","Guía","Instructivo","Manual","Política","Programa","Planes","Plantilla","Procedimiento","Protocolo"];

function normalize(value: string | null | undefined): string | null {
  // Convierte "" y undefined a null para evitar diferencias al buscar
  return value === "" || value === undefined ? null : value;
}


export async function getOrCreateRootFolder(
    firestore: Firestore,
    { areaId, procesoId, subprocesoId }: { areaId: string; procesoId?: string | null; subprocesoId?: string | null }
) {
  
  const normalizedAreaId = normalize(areaId);
  const normalizedProcesoId = normalize(procesoId);
  const normalizedSubprocesoId = normalize(subprocesoId);

  const foldersRef = collection(firestore, "folders");
  const q = query(
    foldersRef,
    where("areaId", "==", normalizedAreaId),
    where("procesoId", "==", normalizedProcesoId),
    where("subprocesoId", "==", normalizedSubprocesoId),
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
    areaId: normalizedAreaId,
    procesoId: normalizedProcesoId,
    subprocesoId: normalizedSubprocesoId,
    parentId: null,
    createdAt: serverTimestamp()
  });

  DEFAULT_FOLDERS.sort().forEach(name => {
    const subFolderRef = doc(foldersRef);
    batch.set(subFolderRef, {
      name,
      parentId: rootRef.id,
      areaId: normalizedAreaId,
      procesoId: normalizedProcesoId,
      subprocesoId: normalizedSubprocesoId,
      createdAt: serverTimestamp()
    });
  });

  await batch.commit();

  return { 
      id: rootRef.id, 
      name: "Documentación", 
      parentId: null, 
      areaId: normalizedAreaId, 
      procesoId: normalizedProcesoId, 
      subprocesoId: normalizedSubprocesoId 
    };
}
