
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { kpiList } from "@/lib/data";
import { MessageSquareHeart } from "lucide-react";

export default function FeedbackPage() {
    return (
        <div className="flex flex-col gap-8">
             <div>
                <h1 className="text-3xl font-bold font-headline">Recolectar Feedback</h1>
                <p className="text-muted-foreground">Comparta sus ideas sobre los Indicadores Clave de Desempeño (KPIs).</p>
            </div>

            <Card className="max-w-2xl mx-auto w-full">
                <CardHeader>
                     <CardTitle className="font-headline flex items-center gap-2">
                        <MessageSquareHeart className="h-5 w-5" /> Enviar Feedback
                    </CardTitle>
                    <CardDescription>Su opinión es valiosa para la mejora continua.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="kpi">Indicador Clave de Desempeño (KPI)</Label>
                        <Select>
                            <SelectTrigger id="kpi">
                                <SelectValue placeholder="Seleccione el KPI relevante" />
                            </SelectTrigger>
                            <SelectContent>
                                {kpiList.map((kpi) => (
                                    <SelectItem key={kpi} value={kpi.toLowerCase().replace(/ /g, '-')}>{kpi}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Tipo de Feedback</Label>
                        <RadioGroup defaultValue="positive" className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="positive" id="r1" />
                                <Label htmlFor="r1">Positivo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement" id="r2" />
                                <Label htmlFor="r2">Sugerencia de Mejora</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="concern" id="r3" />
                                <Label htmlFor="r3">Inquietud</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="comments">Comentarios</Label>
                        <Textarea id="comments" placeholder="Por favor, proporcione detalles sobre su feedback..." rows={5} />
                    </div>
                    
                    <Button className="w-full">Enviar Feedback</Button>
                </CardContent>
            </Card>
        </div>
    );
}
