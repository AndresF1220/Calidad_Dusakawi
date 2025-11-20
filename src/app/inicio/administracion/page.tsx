
'use client';

import { collection } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert, Loader2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { CreateUserForm } from '@/components/dashboard/CreateUserForm';
import { UserActionsDropdown } from '@/components/dashboard/UserActionsDropdown';
import { Skeleton } from '@/components/ui/skeleton';

export type User = {
    id: string;
    fullName: string;
    email: string;
    cedula: string;
    role: 'superadmin' | 'admin' | 'viewer';
    status: 'active' | 'inactive';
    tempPassword?: string;
};

const roleTranslations: Record<User['role'], string> = {
    superadmin: 'Superadministrador',
    admin: 'Administrador',
    viewer: 'Visualizador',
};

const translateRole = (role: User['role']) => {
    return roleTranslations[role] || role;
}

function UserManagement() {
    const firestore = useFirestore();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading, error } = useCollection<User>(usersQuery);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gestión de usuarios</h1>
                    <p className="text-muted-foreground">Aquí se administran los usuarios del sistema.</p>
                </div>
                <CreateUserForm isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <Button>
                        <PlusCircle className="mr-2" />
                        Crear usuario
                    </Button>
                </CreateUserForm>
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
                                <TableHead>Cédula</TableHead>
                                <TableHead>Correo Electrónico</TableHead>
                                <TableHead>Contraseña Temporal</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Cargando usuarios...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-destructive">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertTriangle className="h-6 w-6" />
                                            <span>Error al cargar usuarios: {error.message}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users && users.length > 0 ? (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.fullName || 'N/A'}</TableCell>
                                        <TableCell>{user.cedula || 'N/A'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="font-mono text-xs">{user.tempPassword || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>{translateRole(user.role)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.status === 'active' ? 'outline' : 'destructive'} className={user.status === 'active' ? 'text-green-600 border-green-600' : ''}>
                                                {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <UserActionsDropdown user={user} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No se encontraron usuarios. Comience creando uno.
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

function LoadingPermissions() {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-8 w-1/4" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function AdministracionPage() {
    const { userRole, isRoleLoading } = useAuth();
    
    if (isRoleLoading) {
        return <LoadingPermissions />;
    }

    if (userRole === 'superadmin') {
        return <UserManagement />;
    }

    return <AccessDenied />;
}
