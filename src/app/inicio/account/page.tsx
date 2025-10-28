
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function AccountPage() {
    const user = {
        name: 'Dra. Ana Rodriguez',
        email: 'ana.rodriguez@dusakawi.com',
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxwcm9maWxlfGVufDB8fHx8MTc2MTY0MDYwMXww&ixlib=rb-4.1.0&q=80&w=1080'
    };

    const handleLogout = () => {
        console.log('logout pending');
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
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <CardTitle className="font-headline text-2xl">{user.name}</CardTitle>
                    <CardDescription>{user.role} en Dusakawi EPSI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" defaultValue={user.name} readOnly />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" defaultValue={user.email} readOnly />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button variant="outline" className="w-full" disabled>Cambiar Contraseña</Button>
                        <Button variant="destructive" className="w-full" asChild onClick={handleLogout}>
                           <Link href="/">Cerrar Sesión</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
