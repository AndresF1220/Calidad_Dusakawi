
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

function norm(v:any){ return v === "" || v === undefined ? null : v; }
function scopeKey(areaId:string|null, procesoId:string|null, subprocesoId:string|null){
  return [
    norm(areaId) ?? "_",
    norm(procesoId) ?? "_",
    norm(subprocesoId) ?? "_"
  ].join("__");
}

/**
 * Ensures a root folder for a given scope (area, process, subprocess) exists, creating it if necessary.
 * This function is idempotent and safe to call multiple times. It uses a Firestore transaction
 * to ensure that the root folder is created atomically, preventing race conditions.
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
  const rootKey = `root__${scopeKey(areaId, procesoId, subprocesoId)}`; 
  const rootRef = doc(firestore, "folders", rootKey);

  try {
    await runTransaction(firestore, async (tx)=>{
      const snap = await tx.get(rootRef);
      if (!snap.exists()){
        console.debug(`Root folder ${rootKey} does not exist. Creating...`);
        tx.set(rootRef, {
          name: "Root", // This name is internal and not typically displayed
          parentId: null,
          areaId, procesoId, subprocesoId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    });
  } catch (error: any) {
    if (error.code !== "already-exists") {
      console.error("Transaction to get or create root folder failed:", error);
    } else {
      console.debug("Creation transaction failed because folder already exists. Idempotency maintained.");
    }
  }

  return { id: rootKey, name: "Root", parentId: null, areaId, procesoId, subprocesoId };
}
