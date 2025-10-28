
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { analyzeQualityDataAction, suggestAdditionalDataAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Bot, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Pensando...' : children}
    </Button>
  );
}

function AnalysisForm() {
    const { toast } = useToast();
  const [state, formAction] = useActionState(analyzeQualityDataAction, { message: '', error: undefined });

  useEffect(() => {
    if (state.error) {
        toast({
            variant: "destructive",
            title: "Error de Análisis",
            description: state.error,
        });
    }
  }, [state.error, toast]);

  return (
    <form action={formAction}>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="qualityData">Datos de Calidad</Label>
          <Textarea id="qualityData" name="qualityData" placeholder='Pegue sus datos de calidad aquí (ej: JSON, texto CSV)...' rows={6} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">La IA analizará tendencias y anomalías.</p>
        <SubmitButton>Analizar Datos</SubmitButton>
      </CardFooter>
      {state.data && (
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Análisis Completo</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
                <div>
                    <h4 className="font-semibold">Resumen</h4>
                    <p className="text-sm text-muted-foreground">{state.data.analysisSummary}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Sugerencias de Mejora</h4>
                    <p className="text-sm text-muted-foreground">{state.data.improvementSuggestions}</p>
                </div>
                {state.data.additionalDataRequest && (
                    <div>
                        <h4 className="font-semibold">Datos Adicionales Requeridos</h4>
                        <p className="text-sm text-muted-foreground">{state.data.additionalDataRequest}</p>
                    </div>
                )}
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </form>
  );
}

function SuggestionForm() {
    const { toast } = useToast();
  const [state, formAction] = useActionState(suggestAdditionalDataAction, { message: '', error: undefined });
  
  useEffect(() => {
    if (state.error) {
        toast({
            variant: "destructive",
            title: "Error de Sugerencia",
            description: state.error,
        });
    }
  }, [state.error, toast]);

  return (
    <form action={formAction}>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="currentAnalysis">Análisis Actual</Label>
          <Textarea id="currentAnalysis" name="currentAnalysis" placeholder='Describa el análisis actual o pegue el resumen...' rows={4} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="metricsUsed">Métricas Utilizadas</Label>
          <Input id="metricsUsed" name="metricsUsed" placeholder='ej: Satisfacción del Paciente, Tasa de Cumplimiento' />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">La IA sugerirá nuevos puntos de datos.</p>
        <SubmitButton>Obtener Sugerencias</SubmitButton>
      </CardFooter>
      {state.data && (
         <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Sugerencias de Nuevos Puntos de Datos</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
                <div>
                    <h4 className="font-semibold">Puntos de Datos Sugeridos</h4>
                    <p className="text-sm text-muted-foreground">{state.data.suggestedDataPoints}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Razonamiento</h4>
                    <p className="text-sm text-muted-foreground">{state.data.reasoning}</p>
                </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </form>
  );
}

export default function AnalyticsTool() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary"/>
            <CardTitle className="font-headline">Herramienta de Análisis con IA</CardTitle>
        </div>
        <CardDescription>Utilice la IA para obtener información más profunda de sus datos de calidad.</CardDescription>
      </CardHeader>
      <Tabs defaultValue="analyze">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyze">Analizar Datos de Calidad</TabsTrigger>
          <TabsTrigger value="suggest">Sugerir Puntos de Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="analyze">
            <AnalysisForm />
        </TabsContent>
        <TabsContent value="suggest">
            <SuggestionForm />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
