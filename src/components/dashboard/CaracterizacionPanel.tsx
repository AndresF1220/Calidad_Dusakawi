
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  User,
  Target,
  GitBranch,
  Edit,
  Loader,
} from 'lucide-react';
import CaracterizacionEditor from './CaracterizacionEditor';
import { useIsAdmin } from '@/lib/authMock';

interface CaracterizacionPanelProps {
  idEntidad: string;
  tipo: 'area' | 'proceso' | 'subproceso';
}

interface CaracterizacionData {
  objetivo: string;
  alcance: string;
  responsable: string;
  editable?: boolean;
}

export default function CaracterizacionPanel({
  idEntidad,
  tipo,
}: CaracterizacionPanelProps) {
  const firestore = useFirestore();
  const isAdmin = useIsAdmin();
  const [caracterizacion, setCaracterizacion] =
    useState<CaracterizacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  let docId = `area-${idEntidad}`;
  if (tipo === 'proceso') {
      docId = `process-${idEntidad}`;
  } else if (tipo === 'subproceso') {
      docId = `subprocess-${idEntidad}`;
  }


  useEffect(() => {
    if (!firestore || !idEntidad) {
        setLoading(false); // If firestore is not ready, stop loading
        return;
    };

    setLoading(true);
    const docRef = doc(firestore, 'caracterizaciones', docId);
    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CaracterizacionData;
          setCaracterizacion(data);
        } else {
          // Document doesn't exist, create it with default empty values if user is admin
          // This ensures that new entities always have a characterization doc ready
          if (isAdmin) {
             const newCaracterizacion = {
              idEntidad,
              tipo,
              objetivo: '',
              alcance: '',
              responsable: '',
              fechaCreacion: serverTimestamp(),
              creadaPor: 'system', // or a user ID
            };
            try {
              // No merge here, we are creating it for the first time.
              await setDoc(docRef, newCaracterizacion);
              // The listener will pick up the new document, but we can set state here to be faster
              // and avoid showing the "not registered" message for a split second.
              setCaracterizacion(newCaracterizacion);
            } catch (error) {
               console.error("Error creating caracterizacion:", error);
            }
          } else {
            setCaracterizacion(null);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching caracterizacion:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, idEntidad, tipo, docId, isAdmin]);
  
  const isDataEmpty = !caracterizacion || (!caracterizacion.objetivo && !caracterizacion.alcance && !caracterizacion.responsable);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="font-headline">
            Caracterización del {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </CardTitle>
        </div>
        {isAdmin && (
          <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Editar Caracterización</DialogTitle>
                    <DialogDescription>
                        Ajuste los detalles para este {tipo}.
                    </DialogDescription>
                </DialogHeader>
                <CaracterizacionEditor 
                    idEntidad={idEntidad}
                    tipo={tipo}
                    onSaved={() => setIsEditorOpen(false)}
                />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
           <div className="flex justify-center items-center h-40">
                <Loader className="h-8 w-8 animate-spin text-primary" />
           </div>
        ) : isDataEmpty ? (
             <p className="text-muted-foreground text-center py-4">
               {isAdmin 
                 ? "No se ha registrado la caracterización para este elemento. Haga clic en 'Editar' para comenzar."
                 : "Aún no se ha agregado información."
               }
            </p>
        ) : (
          <div className="space-y-6 text-sm">
              <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Objetivo
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                  {caracterizacion?.objetivo || <em>No definido.</em>}
              </p>
              </div>
              <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  Alcance
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                  {caracterizacion?.alcance || <em>No definido.</em>}
              </p>
              </div>
              <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Responsable
              </h3>
              <p className="text-muted-foreground">
                  {caracterizacion?.responsable || <em>No definido.</em>}
              </p>
              </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
