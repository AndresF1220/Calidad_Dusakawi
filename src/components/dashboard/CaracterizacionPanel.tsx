
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
  doc,
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
import { useAuth } from '@/lib/auth';
import { useCaracterizacion } from '@/hooks/use-areas-data';

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
  const { userRole } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  let docId: string | null = null;
  if (tipo === 'area') {
    docId = `area-${idEntidad}`;
  } else if (tipo === 'proceso') {
    docId = `process-${idEntidad}`;
  } else if (tipo === 'subproceso') {
    docId = `subprocess-${idEntidad}`;
  }

  const { caracterizacion, isLoading: loading } = useCaracterizacion(docId);
  
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
        {userRole === 'superadmin' && (
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
                    entityId={idEntidad}
                    entityType={tipo}
                    onSaved={() => setIsEditorOpen(false)}
                    initialData={{
                      objetivo: caracterizacion?.objetivo || '',
                      alcance: caracterizacion?.alcance || '',
                      responsable: caracterizacion?.responsable || '',
                    }}
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
               {userRole === 'superadmin' 
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
