
import { collection, getDocs, query, where, doc, writeBatch, type Firestore } from "firebase/firestore";

function norm(v:any){ return v === "" || v === undefined ? null : v; }
function scopeKey(areaId:any, procesoId:any, subprocesoId:any){
  return [norm(areaId) ?? "_", norm(procesoId) ?? "_", norm(subprocesoId) ?? "_"].join("__");
}

export async function migrateDedupRoots(firestore: Firestore){
  const foldersCol = collection(firestore, "folders");
  const rootsSnap = await getDocs(query(foldersCol, where("parentId","==", null)));
  const groups = new Map<string, any[]>();

  rootsSnap.forEach(d=>{
    const data = d.data() as any;
    const key = scopeKey(data.areaId, data.procesoId, data.subprocesoId);
    const arr = groups.get(key) ?? [];
    arr.push({ id: d.id, ...data });
    groups.set(key, arr);
  });

  for (const [key, arr] of groups.entries()){
    if (arr.length <= 1) continue;
    
    console.log(`Found ${arr.length} roots for scope ${key}. Migrating...`);

    // Elegir ganador preferentemente con id determinístico
    const deterministicId = `root__${key}`;
    let winner = arr.find(x => x.id === deterministicId) || arr.sort((a,b) => a.createdAt.seconds - b.createdAt.seconds)[0];

    // Perdedorxs = todos menos winner
    const losers = arr.filter(x => x.id !== winner.id);
    
    // Si el ganador no tiene ID determinístico, hay que "renombrarlo"
    const needsRename = winner.id !== deterministicId;

    if (needsRename){
      console.log(`Winner ${winner.id} needs to be renamed to ${deterministicId}`);
      const batch1 = writeBatch(firestore);
      const newWinnerRef = doc(foldersCol, deterministicId);
      
      const { id, ...winnerData } = winner;
      batch1.set(newWinnerRef, winnerData);
      
      // Mover hijos del winner antiguo al nuevo id
      const childsSnap = await getDocs(query(foldersCol, where("parentId","==", winner.id)));
      childsSnap.forEach(c => batch1.update(doc(foldersCol, c.id), { parentId: deterministicId }));
      console.log(`Moving ${childsSnap.size} children from old winner ${winner.id} to new winner ${deterministicId}`);

      // Borrar winner antiguo
      batch1.delete(doc(foldersCol, winner.id));
      await batch1.commit();

      // El nuevo ganador es el que acabamos de crear
      winner = { ...winnerData, id: deterministicId };
    }

    // Mover hijos de cada perdedor al ganador y borrar perdedores
    for (const loser of losers){
      console.log(`Processing loser ${loser.id}...`);
      const batch2 = writeBatch(firestore);
      const childsSnap = await getDocs(query(foldersCol, where("parentId","==", loser.id)));
      
      console.log(`Moving ${childsSnap.size} children from loser ${loser.id} to winner ${winner.id}`);
      childsSnap.forEach(c => batch2.update(doc(foldersCol, c.id), { parentId: winner.id }));
      
      batch2.delete(doc(foldersCol, loser.id));
      await batch2.commit();
    }
  }
}
