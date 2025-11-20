
'use client';

import { collection } from 'firebase/firestore';
import { useAuth } from '@/lib/auth.tsx';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { useState } from 'react';

type User = {
    id: string;
    fullName: string;
    email: string;
    role: 'superadmin' | 'admin' | 'viewer';
};

function UserManagement() {
    const firestore = useFirestore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gestión de usuarios</h1>
                    <p className="text-muted-foreground">Aquí se administran los usuarios del sistema.</p>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Crear usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                            <DialogDescription>
                                La funcionalidad para crear un nuevo usuario se implementará próximamente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-center text-muted-foreground">(Formulario de creación de usuario irá aquí)</p>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Usuarios</CardTitle>
                    <CardDescription>Usuarios registrados en el sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Cargando usuarios...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users && users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.fullName || 'N/A'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-green-600 border-green-600">Activo</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No se encontraron usuarios.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function AccessDenied() {
    return (
         <div className="flex flex-col items-center justify-center h-96 text-center">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold font-headline mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">No tiene los permisos necesarios para acceder a esta sección.</p>
        </div>
    )
}

export default function AdministracionPage() {
    const { userRole } = useAuth();
    
    if (userRole === 'superadmin') {
        return <UserManagement />;
    }

    return <AccessDenied />;
}
