import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { alertsData, kpiList } from "@/lib/data";
import { BellPlus, Trash2 } from "lucide-react";

export default function AlertsPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Alertas Personalizables</h1>
                <p className="text-muted-foreground">Configure notificaciones para desviaciones críticas de calidad.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                           <BellPlus className="h-5 w-5" /> Crear Nueva Alerta
                        </CardTitle>
                        <CardDescription>Establezca una nueva regla de notificación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid gap-2">
                            <Label htmlFor="metric">Métrica</Label>
                             <Select>
                                <SelectTrigger id="metric">
                                    <SelectValue placeholder="Seleccione un KPI" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kpiList.map((kpi) => (
                                        <SelectItem key={kpi} value={kpi.toLowerCase().replace(/ /g, '-')}>{kpi}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label htmlFor="condition">Condición</Label>
                                <Select defaultValue="less-than">
                                    <SelectTrigger id="condition">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="less-than">Cae por debajo de</SelectItem>
                                        <SelectItem value="greater-than">Supera</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="threshold">Umbral</Label>
                                <Input id="threshold" type="number" placeholder="ej: 90" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notification">Canal de Notificación</Label>
                             <Select defaultValue="email">
                                <SelectTrigger id="notification">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">Correo electrónico</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                    <SelectItem value="in-app">Notificación en la app</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <Button className="w-full">Guardar Alerta</Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-headline">Alertas Existentes</CardTitle>
                        <CardDescription>Gestione sus configuraciones de alerta actuales.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Métrica</TableHead>
                                    <TableHead>Condición</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alertsData.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell className="font-medium">{alert.metric}</TableCell>
                                        <TableCell>{alert.condition}</TableCell>
                                        <TableCell>
                                            <Switch defaultChecked={alert.status === 'Activa'} id={`alert-status-${alert.id}`} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Eliminar</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
