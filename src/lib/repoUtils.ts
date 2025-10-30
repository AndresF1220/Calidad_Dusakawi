
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

/**
 * Creates a root folder for a given scope (area, process, subprocess) if it doesn't exist.
 * This function is idempotent and safe to call multiple times. It uses a Firestore transaction
 * to ensure that the root folder and its default subfolders are created atomically, preventing
 * race conditions and duplicates.
 * 
 * This is the single source of truth for repository structure initialization.
 * 
 * @param firestore - The Firestore instance.
 * @param {object} scope - The scope for which to create the folder.
 * @param {string|null} scope.areaId - The area ID.
 * @param {string|null} [scope.procesoId=null] - The process ID.
 * @param {string|null} [scope.subprocesoId=null] - The subprocess ID.
 * @returns {Promise<object>} A promise that resolves to the root folder's data.
 */
export async function getOrCreateRootFolder(firestore: Firestore, { areaId, procesoId=null, subprocesoId=null }:{
  areaId:string|null; procesoId?:string|null; subprocesoId?:string|null;
}){
  areaId = norm(areaId); procesoId = norm(procesoId); subprocesoId = norm(subprocesoId);
  // The rootKey is deterministic, ensuring we always operate on the same document for a given scope.
  const rootKey = `root__${scopeKey(areaId, procesoId, subprocesoId)}`; 
  const rootRef = doc(firestore, "folders", rootKey);
  const foldersCol = collection(firestore, "folders");

  // A transaction ensures this entire block is atomic. It will either all succeed or all fail.
  // This prevents race conditions where multiple clients might try to create the folder at once.
  try {
    await runTransaction(firestore, async (tx)=>{
      const snap = await tx.get(rootRef);
      // Only if the root folder does not exist, we create it and its children.
      if (!snap.exists()){
        console.debug(`Root folder ${rootKey} does not exist. Creating...`);
        // 1. Create the root folder "Documentación".
        tx.set(rootRef, {
          name: "Documentación",
          parentId: null,
          areaId, procesoId, subprocesoId,
          createdAt: serverTimestamp()
        });

        // 2. Create all standard subfolders inside the same transaction.
        DEFAULT_FOLDERS.forEach(folderName => {
            const newSubFolderRef = doc(foldersCol); // Auto-generate ID for subfolders
            tx.set(newSubFolderRef, {
                name: folderName,
                parentId: rootKey,
                areaId, procesoId, subprocesoId,
                createdAt: serverTimestamp()
            });
        });
      }
    });
  } catch (error: any) {
    // We specifically check for "already-exists" which can happen in some edge cases with transactions,
    // but we can safely ignore it as it means the goal (folder exists) is met.
    if (error.code !== "already-exists") {
      console.error("Transaction to get or create root folder failed:", error);
    } else {
      console.debug("Creation transaction failed because folder already exists. Idempotency maintained.");
    }
  }

  return { id: rootKey, name: "Documentación", parentId: null, areaId, procesoId, subprocesoId };
}
