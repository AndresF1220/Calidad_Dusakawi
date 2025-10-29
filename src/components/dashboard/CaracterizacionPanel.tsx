
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

interface CaracterizacionPanelProps {
  idEntidad: string;
  tipo: 'area' | 'proceso' | 'subproceso';
  isAdmin?: boolean;
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
  isAdmin = false,
}: CaracterizacionPanelProps) {
  const firestore = useFirestore();
  const [caracterizacion, setCaracterizacion] =
    useState<CaracterizacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const docId = `${tipo}-${idEntidad.replace(/:/g, '_')}`;

  useEffect(() => {
    if (!firestore) return;

    const docRef = doc(firestore, 'caracterizaciones', docId);
    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CaracterizacionData;
          setCaracterizacion(data);
        } else {
          // Document doesn't exist, create it with default empty values
          const newCaracterizacion = {
            idEntidad,
            tipo,
            objetivo: '',
            alcance: '',
            responsable: '',
            fechaCreacion: serverTimestamp(),
            creadaPor: 'system',
            editable: true,
          };
          try {
            await setDoc(docRef, newCaracterizacion);
            // Listener will pick up the new document, but we can set state here to be faster
            setCaracterizacion(newCaracterizacion);
          } catch (error) {
             console.error("Error creating caracterizacion:", error);
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
  }, [firestore, idEntidad, tipo, docId]);
  
  const canEdit = isAdmin && (caracterizacion ? caracterizacion.editable !== false : true);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="font-headline">
            Caracterización del {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </CardTitle>
        </div>
        {canEdit && (
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
                        Ajuste los detalles para el {tipo} &quot;{idEntidad}&quot;.
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
        ) : (
          (caracterizacion?.objetivo || caracterizacion?.alcance || caracterizacion?.responsable) ? (
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
           ) : (
             <p className="text-muted-foreground text-center py-4">
               No se ha registrado la caracterización para este elemento.
               {canEdit && " Haga clic en 'Editar' para comenzar."}
            </p>
           )
        )}
      </CardContent>
    </Card>
  );
}
