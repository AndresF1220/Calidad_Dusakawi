'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { analyzeQualityDataAction, suggestAdditionalDataAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Bot, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Thinking...' : children}
    </Button>
  );
}

function AnalysisForm() {
    const { toast } = useToast();
  const [state, formAction] = useFormState(analyzeQualityDataAction, { message: '', error: undefined });

  useEffect(() => {
    if (state.error) {
        toast({
            variant: "destructive",
            title: "Analysis Error",
            description: state.error,
        });
    }
  }, [state.error, toast]);

  return (
    <form action={formAction}>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="qualityData">Quality Data</Label>
          <Textarea id="qualityData" name="qualityData" placeholder='Paste your quality data here (e.g., JSON, CSV text)...' rows={6} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">The AI will analyze trends and anomalies.</p>
        <SubmitButton>Analyze Data</SubmitButton>
      </CardFooter>
      {state.data && (
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Analysis Complete</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
                <div>
                    <h4 className="font-semibold">Summary</h4>
                    <p className="text-sm text-muted-foreground">{state.data.analysisSummary}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Improvement Suggestions</h4>
                    <p className="text-sm text-muted-foreground">{state.data.improvementSuggestions}</p>
                </div>
                {state.data.additionalDataRequest && (
                    <div>
                        <h4 className="font-semibold">Additional Data Required</h4>
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
  const [state, formAction] = useFormState(suggestAdditionalDataAction, { message: '', error: undefined });
  
  useEffect(() => {
    if (state.error) {
        toast({
            variant: "destructive",
            title: "Suggestion Error",
            description: state.error,
        });
    }
  }, [state.error, toast]);

  return (
    <form action={formAction}>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="currentAnalysis">Current Analysis</Label>
          <Textarea id="currentAnalysis" name="currentAnalysis" placeholder='Describe the current analysis or paste the summary...' rows={4} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="metricsUsed">Metrics Used</Label>
          <Input id="metricsUsed" name="metricsUsed" placeholder='e.g., Patient Satisfaction, Compliance Rate' />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">The AI will suggest new data points.</p>
        <SubmitButton>Get Suggestions</SubmitButton>
      </CardFooter>
      {state.data && (
         <CardContent>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>New Data Point Suggestions</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
                <div>
                    <h4 className="font-semibold">Suggested Data Points</h4>
                    <p className="text-sm text-muted-foreground">{state.data.suggestedDataPoints}</p>
                </div>
                <div>
                    <h4 className="font-semibold">Reasoning</h4>
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
            <CardTitle className="font-headline">AI Analytics Tool</CardTitle>
        </div>
        <CardDescription>Leverage AI to gain deeper insights from your quality data.</CardDescription>
      </CardHeader>
      <Tabs defaultValue="analyze">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyze">Analyze Quality Data</TabsTrigger>
          <TabsTrigger value="suggest">Suggest Data Points</TabsTrigger>
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
