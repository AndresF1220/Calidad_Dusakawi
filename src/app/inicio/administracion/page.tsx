'use client';

import { collection } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert, Loader2, AlertTriangle, Search, X, Eye, EyeOff, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { CreateUserForm } from '@/components/dashboard/CreateUserForm';
import { UserActionsDropdown } from '@/components/dashboard/UserActionsDropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';


export type User = {
    id: string;
    fullName: string;
    email: string;
    cedula: string;
    role: 'superadmin' | 'admin' | 'viewer';
    status: 'active' | 'inactive';
    tempPassword?: string;
    areaId: string;
    areaNombre: string;
    procesoId?: string | null;
    procesoNombre?: string | null;
    subprocesoId?: string | null;
    subprocesoNombre?: string | null;
};

type SortDirection = 'ascending' | 'descending';
type SortKey = 'fullName' | 'cedula' | 'email' | 'area' | 'role';


const roleTranslations: Record<User['role'], string> = {
    superadmin: 'Superadministrador',
    admin: 'Administrador',
    viewer: 'Visualizador',
};

const translateRole = (role: User['role']) => {
    return roleTranslations[role] || role;
}

const getHierarchyName = (user: User) => {
    return user.subprocesoNombre || user.procesoNombre || user.areaNombre || 'N/A';
};

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};


function UserManagement() {
    const firestore = useFirestore();
    const { user: currentUser } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'fullName',
        direction: 'ascending',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;


    const togglePasswordVisibility = (userId: string) => {
        setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
    };
    
    const clearFilters = () => {
        setRoleFilter('all');
        setStatusFilter('all');
    };

    const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading, error } = useCollection(usersQuery);

    const filteredUsers = useMemo(() => {
        if (!users) return [];

        let intermediateUsers = users as User[];

        // Filter by role
        if (roleFilter !== 'all') {
            intermediateUsers = intermediateUsers.filter(user => user.role === roleFilter);
        }

        // Filter by status
        if (statusFilter !== 'all') {
            intermediateUsers = intermediateUsers.filter(user => user.status === statusFilter);
        }
        
        // Filter by search term
        const normalizedSearchTerm = normalizeText(searchTerm.trim());
        if (normalizedSearchTerm.length < 1) return intermediateUsers;

        return intermediateUsers.filter(user => {
            const normalizedFullName = normalizeText(user.fullName);
            const normalizedEmail = normalizeText(user.email);
            const normalizedCedula = normalizeText(user.cedula);
            return (
                (normalizedFullName && normalizedFullName.includes(normalizedSearchTerm)) ||
                (normalizedEmail && normalizedEmail.includes(normalizedSearchTerm)) ||
                (normalizedCedula && normalizedCedula.includes(normalizedSearchTerm))
            );
        });
    }, [users, searchTerm, roleFilter, statusFilter]);
    
    const sortedUsers = useMemo(() => {
        if (!filteredUsers || filteredUsers.length === 0) return [];
        const sortableItems = [...filteredUsers];

        sortableItems.sort((a, b) => {
            const key = sortConfig.key;
            let aValue: string | null | undefined;
            let bValue: string | null | undefined;

            if (key === 'area') {
                aValue = getHierarchyName(a);
                bValue = getHierarchyName(b);
            } else {
                aValue = a[key as keyof Omit<User, 'area'>];
                bValue = b[key as keyof Omit<User, 'area'>];
            }

            const strA = aValue || '';
            const strB = bValue || '';

            if (sortConfig.direction === 'ascending') {
                return strA.localeCompare(strB, 'es', { numeric: true });
            } else {
                return strB.localeCompare(strA, 'es', { numeric: true });
            }
        });
        return sortableItems;
    }, [filteredUsers, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter, sortedUsers.length]);

    const { paginatedUsers, totalPages } = useMemo(() => {
        const total = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = sortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        return { paginatedUsers: paginated, totalPages: total };
    }, [sortedUsers, currentPage]);

    
    const handleSort = (e: React.MouseEvent<HTMLTableCellElement>, key: SortKey) => {
        e.preventDefault();
        let direction: SortDirection = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const renderSortArrow = (columnKey: SortKey) => {
        if (sortConfig.key !== columnKey) {
            return <span className="h-4 w-4" />;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUp className="h-4 w-4" />;
        }
        return <ArrowDown className="h-4 w-4" />;
    };


    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">Aquí se administran los usuarios del sistema.</p>
                </div>
                <CreateUserForm isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <Button>
                        <PlusCircle className="mr-2" />
                        Crear usuario
                    </Button>
                </CreateUserForm>
            </div>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Lista de Usuarios</CardTitle>
                    <CardDescription>Usuarios registrados en el sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre, correo o cédula..."
                                className="w-full rounded-lg bg-background pl-8 pr-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            )}
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filtrar
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60" align="end">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Filtros</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Ajusta los filtros para la lista de usuarios.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="role">Rol</Label>
                                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                                <SelectTrigger id="role" className="col-span-2 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="superadmin">Superadmin</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="viewer">Viewer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor="status">Estado</Label>
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger id="status" className="col-span-2 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="active">Activo</SelectItem>
                                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="relative w-full overflow-x-auto border rounded-md">
                        <Table className="w-full table-fixed">
                            <TableHeader>
                                 <TableRow className="bg-muted/50 border-b">
                                    <TableHead className="text-center align-middle text-sm font-medium text-muted-foreground cursor-pointer" style={{ width: '25%' }} onClick={(e) => handleSort(e, 'fullName')}>
                                        <div className="flex items-center justify-center gap-1">Nombre {renderSortArrow('fullName')}</div>
                                    </TableHead>
                                    <TableHead className="text-center align-middle text-sm font-medium text-muted-foreground hidden md:table-cell cursor-pointer" style={{ width: '12%' }} onClick={(e) => handleSort(e, 'cedula')}>
                                        <div className="flex items-center justify-center gap-1">Cédula {renderSortArrow('cedula')}</div>
                                    </TableHead>
                                    <TableHead className="text-center align-middle text-sm font-medium text-muted-foreground cursor-pointer" style={{ width: '25%' }} onClick={(e) => handleSort(e, 'email')}>
                                        <div className="flex items-center justify-center gap-1">Correo Electrónico {renderSortArrow('email')}</div>
                                    </TableHead>
                                    <TableHead className="text-center align-middle text-sm font-medium text-muted-foreground cursor-pointer" style={{ width: '25%' }} onClick={(e) => handleSort(e, 'area')}>
                                        <div className="flex items-center justify-center gap-1">Área {renderSortArrow('area')}</div>
                                    </TableHead>
                                    <TableHead className="text-center align-middle text-sm font-medium text-muted-foreground hidden lg:table-cell" style={{ width: '15%' }}>Contraseña</TableHead>
                                    <TableHead className="text-center align-middle text-sm font-medium text-muted-foreground cursor-pointer" style={{ width: '20%' }} onClick={(e) => handleSort(e, 'role')}>
                                        <div className="flex items-center justify-center gap-1">Rol y Estado {renderSortArrow('role')}</div>
                                    </TableHead>
                                    <TableHead className="text-center align-middle text-sm font-medium text-muted-foreground" style={{ width: '10%' }}>Acciones</TableHead>
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
                                ) : paginatedUsers && paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((user) => (
                                        <TableRow key={user.id} className="h-auto">
                                            <TableCell className="font-medium text-left align-middle py-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="truncate">
                                                                {user.fullName || 'N/A'}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{user.fullName || 'N/A'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell className="text-center align-middle py-2 hidden md:table-cell">{user.cedula || 'N/A'}</TableCell>
                                            <TableCell className="text-left align-middle py-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="truncate">
                                                                {user.email}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{user.email}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell className="text-left align-middle py-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="truncate">
                                                                {getHierarchyName(user)}
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{getHierarchyName(user)}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-center align-middle py-2 hidden lg:table-cell">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span>
                                                        {visiblePasswords[user.id] ? (user.tempPassword || 'N/A') : '••••••••'}
                                                    </span>
                                                    {user.tempPassword && (
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => togglePasswordVisibility(user.id)}>
                                                            {visiblePasswords[user.id] ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-middle py-2">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'} className="whitespace-nowrap">{translateRole(user.role)}</Badge>
                                                    <Badge variant={user.status === 'active' ? 'outline' : 'destructive'} className={`whitespace-nowrap ${user.status === 'active' ? 'text-green-600 border-green-600' : ''}`}>
                                                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center align-middle py-2">
                                                <div className="flex items-center justify-center">
                                                    <UserActionsDropdown 
                                                        user={user} 
                                                        currentUserId={currentUser?.uid ?? null}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                 ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            {users && users.length > 0 ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No se encontraron usuarios. Comience creando uno.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <span className="text-sm text-muted-foreground">
                            Página {totalPages > 0 ? currentPage : 0} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Siguiente
                        </Button>
                    </div>
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
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 mt-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AdministracionPage() {
    const { user, userRole, isRoleLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isRoleLoading && userRole !== 'superadmin') {
            router.push('/inicio');
        }
    }, [isRoleLoading, userRole, router, user]);
    
    if (isRoleLoading || !user) {
        return <LoadingPermissions />;
    }

    if (userRole === 'superadmin') {
        return <UserManagement />;
    }

    return <LoadingPermissions />;
}
