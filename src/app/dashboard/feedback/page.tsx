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
                <h1 className="text-3xl font-bold font-headline">Collect Feedback</h1>
                <p className="text-muted-foreground">Share your insights on Key Performance Indicators (KPIs).</p>
            </div>

            <Card className="max-w-2xl mx-auto w-full">
                <CardHeader>
                     <CardTitle className="font-headline flex items-center gap-2">
                        <MessageSquareHeart className="h-5 w-5" /> Submit Feedback
                    </CardTitle>
                    <CardDescription>Your input is valuable for continuous improvement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="kpi">Key Performance Indicator (KPI)</Label>
                        <Select>
                            <SelectTrigger id="kpi">
                                <SelectValue placeholder="Select the relevant KPI" />
                            </SelectTrigger>
                            <SelectContent>
                                {kpiList.map((kpi) => (
                                    <SelectItem key={kpi} value={kpi.toLowerCase().replace(/ /g, '-')}>{kpi}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Feedback Type</Label>
                        <RadioGroup defaultValue="positive" className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="positive" id="r1" />
                                <Label htmlFor="r1">Positive</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="improvement" id="r2" />
                                <Label htmlFor="r2">Suggestion for Improvement</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="concern" id="r3" />
                                <Label htmlFor="r3">Concern</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="comments">Comments</Label>
                        <Textarea id="comments" placeholder="Please provide details about your feedback..." rows={5} />
                    </div>
                    
                    <Button className="w-full">Submit Feedback</Button>
                </CardContent>
            </Card>
        </div>
    );
}
