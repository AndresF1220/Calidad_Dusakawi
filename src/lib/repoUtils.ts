
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  runTransaction,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

const DEFAULT_FOLDERS = [
  "Circular","Formato","Guía","Instructivo","Manual",
  "Planes","Plantilla","Política","Procedimiento","Programa","Protocolo"
];

function norm(v:any){ return v === "" || v === undefined ? null : v; }
function scopeKey(areaId:string|null, procesoId:string|null, subprocesoId:string|null){
  return [
    norm(areaId) ?? "_",
    norm(procesoId) ?? "_",
    norm(subprocesoId) ?? "_"
  ].join("__");
}

export async function getOrCreateRootFolder(firestore: Firestore, { areaId, procesoId=null, subprocesoId=null }:{
  areaId:string|null; procesoId?:string|null; subprocesoId?:string|null;
}){
  areaId = norm(areaId); procesoId = norm(procesoId); subprocesoId = norm(subprocesoId);
  const rootKey = `root__${scopeKey(areaId, procesoId, subprocesoId)}`; // id único y estable
  const rootRef = doc(firestore, "folders", rootKey);
  const foldersCol = collection(firestore, "folders");

  // Transacción para crear/leer de forma atómica
  try {
    await runTransaction(firestore, async (tx)=>{
      const snap = await tx.get(rootRef);
      if (!snap.exists()){
        console.log(`Root folder ${rootKey} does not exist. Creating...`);
        tx.set(rootRef, {
          name: "Documentación",
          parentId: null,
          areaId, procesoId, subprocesoId,
          createdAt: serverTimestamp()
        });

        // Create standard subfolders inside the transaction for atomicity
        DEFAULT_FOLDERS.forEach(folderName => {
            const newSubFolderRef = doc(foldersCol); // Auto-generate ID
            tx.set(newSubFolderRef, {
                name: folderName,
                parentId: rootKey,
                areaId, procesoId, subprocesoId,
                createdAt: serverTimestamp()
            });
        });
      }
    });
  } catch (error) {
    console.error("Transaction to get or create root folder failed:", error);
  }

  return { id: rootKey, name: "Documentación", parentId: null, areaId, procesoId, subprocesoId };
}
