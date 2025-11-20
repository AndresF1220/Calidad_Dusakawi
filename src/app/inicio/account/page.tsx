
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getAuth, signOut } from "firebase/auth";
import { useFirebaseApp } from "@/firebase";
import { useRouter } from "next/navigation";
import { useAppSettings } from "@/hooks/use-app-settings";

export default function AccountPage() {
    const { user } = useAuth();
    const { settings, isLoading } = useAppSettings();
    const app = useFirebaseApp();
    const router = useRouter();

    const handleLogout = () => {
        const auth = getAuth(app);
        signOut(auth).then(() => {
            router.push('/');
        });
    };
    
    const displayUser = {
        name: user?.displayName || 'Usuario',
        email: user?.email || 'usuario@example.com',
        role: 'Admin', // This should be dynamic in a real app
        avatar: user?.photoURL || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwcm9maWxlfGVufDB8fHx8MTc2MTY0MDYwMXww&ixlib=rb-4.1.0&q=80&w=1080'
    };

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Cuenta</h1>
                <p className="text-muted-foreground">Administre la configuración de su cuenta.</p>
            </div>

            <Card className="max-w-2xl mx-auto w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
                            <AvatarFallback>{displayUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <CardTitle className="font-headline text-2xl">{displayUser.name}</CardTitle>
                    <CardDescription>{isLoading ? '...' : settings.companyName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" defaultValue={displayUser.name} readOnly />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" defaultValue={displayUser.email} readOnly />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button variant="outline" className="w-full" disabled>Cambiar Contraseña</Button>
                        <Button variant="destructive" className="w-full" onClick={handleLogout}>
                           Cerrar Sesión
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    