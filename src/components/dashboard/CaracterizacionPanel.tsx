'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  User,
  Target,
  GitBranch,
  Edit,
  Save,
  X,
  Loader,
} from 'lucide-react';

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
  const isSuperuser = true; // Mock superuser role

  const [caracterizacion, setCaracterizacion] =
    useState<CaracterizacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CaracterizacionData>({
    objetivo: '',
    alcance: '',
    responsable: '',
  });

  useEffect(() => {
    if (!firestore) {
      setLoading(true); // Keep loading if firestore is not available
      return;
    }

    const docId = `${tipo}-${idEntidad.replace(/:/g, '_')}`;
    const docRef = doc(firestore, 'caracterizaciones', docId);

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as CaracterizacionData;
          setCaracterizacion(data);
          setFormData(data);
          setLoading(false);
        } else {
          // Document doesn't exist, create it with default empty values
          const newCaracterizacion = {
            idEntidad,
            tipo,
            objetivo: '',
            alcance: '',
            responsable: '',
            fechaCreacion: serverTimestamp(),
            creadaPor: 'system', // or a superuser id
            repositorioId: idEntidad,
            editable: true,
          };
          try {
            await setDoc(docRef, newCaracterizacion);
            // The listener will pick up the new document, but we can set state here to be faster
            setCaracterizacion(newCaracterizacion);
            setFormData(newCaracterizacion);
          } catch (error) {
             console.error("Error creating caracterizacion:", error);
          } finally {
            setLoading(false); // Ensure loading is false after creation attempt
          }
        }
      },
      (error) => {
        console.error('Error fetching caracterizacion:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, idEntidad, tipo]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!firestore) return;
    setIsEditing(false);
    
    const docId = `${tipo}-${idEntidad.replace(/:/g, '_')}`;
    const docRef = doc(firestore, 'caracterizaciones', docId);

    try {
      await setDoc(
        docRef,
        {
          ...formData,
          fechaModificacion: serverTimestamp(),
        },
        { merge: true }
      );
      // Optimistic update in UI is handled by onSnapshot
    } catch (error) {
      console.error('Error saving characterization: ', error);
      // Optionally, revert UI changes or show an error toast
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to the original state
    if (caracterizacion) {
      setFormData(caracterizacion);
    }
  };
  
  const canEdit = isSuperuser && (caracterizacion ? caracterizacion.editable : true);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="font-headline">
            Caracterización del {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </CardTitle>
        </div>
        {canEdit && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
           <div className="flex justify-center items-center h-40">
                <Loader className="h-8 w-8 animate-spin text-primary" />
           </div>
        ) : isEditing ? (
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="objetivo">Objetivo</Label>
              <Textarea
                id="objetivo"
                name="objetivo"
                value={formData.objetivo}
                onChange={handleInputChange}
                placeholder="Defina el propósito fundamental..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alcance">Alcance</Label>
              <Textarea
                id="alcance"
                name="alcance"
                value={formData.alcance}
                onChange={handleInputChange}
                placeholder="Describa los límites y el ámbito de aplicación..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleInputChange}
                placeholder="Cargo o rol responsable"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
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
