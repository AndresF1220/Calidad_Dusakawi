
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { qualityMetrics, overviewChartData, recentReportsData } from "@/lib/data";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AnalyticsTool from "@/components/dashboard/analytics-tool";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your Quality Central dashboard.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {qualityMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.changeType === 'increase' ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {metric.change}
                </span>
                {' '}{metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Quality KPIs Overview</CardTitle>
            <CardDescription>Monthly trends for key performance indicators.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              compliance: { label: "Compliance", color: "hsl(var(--chart-1))" },
              satisfaction: { label: "Satisfaction", color: "hsl(var(--chart-2))" },
            }} className="h-[300px] w-full">
              <LineChart data={overviewChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Legend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="compliance" stroke="var(--color-compliance)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="satisfaction" stroke="var(--color-satisfaction)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle className="font-headline">Recent Reports</CardTitle>
            <CardDescription>Quick access to the latest quality reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReportsData.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="font-medium">{report.title}</div>
                      <div className="text-sm text-muted-foreground">{report.author} - {report.date}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          report.status === 'Completed' ? 'default' : 
                          report.status === 'In Progress' ? 'secondary' : 'outline'
                        }
                        className={
                          report.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-700 border-transparent' :
                          report.status === 'In Progress' ? 'bg-blue-500/20 text-blue-700 border-transparent' : ''
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <AnalyticsTool />

    </div>
  );
}
