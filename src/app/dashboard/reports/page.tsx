
"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { recentReportsData, overviewChartData } from '@/lib/data';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({ from: new Date(2023, 0, 1), to: new Date() });

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Módulo de Informes</h1>
                <p className="text-muted-foreground">Genere y vea informes de calidad detallados.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Generar Informe</CardTitle>
                    <CardDescription>Seleccione criterios para generar un informe personalizado.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Select>
                        <SelectTrigger className="w-full sm:w-[240px]">
                            <SelectValue placeholder="Seleccione tipo de informe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="patient-satisfaction">Satisfacción del Paciente</SelectItem>
                            <SelectItem value="compliance">Resumen de Cumplimiento</SelectItem>
                            <SelectItem value="wait-times">Análisis de Tiempos de Espera</SelectItem>
                            <SelectItem value="incidents">Resumen de Incidentes</SelectItem>
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className="w-full sm:w-[300px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Elija una fecha</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => range && setDateRange(range)}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button className="ml-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Generar y Descargar
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Cumplimiento por Departamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{
                            compliance: { label: "Cumplimiento", color: "hsl(var(--chart-1))" },
                            }} className="h-[300px] w-full">
                            <BarChart data={[
                                { department: 'Cardiología', compliance: 99.2 },
                                { department: 'Urgencias', compliance: 97.5 },
                                { department: 'Pediatría', compliance: 98.8 },
                                { department: 'Oncología', compliance: 99.5 },
                                { department: 'Cirugía', compliance: 98.1 },
                            ]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="department" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis domain={[95, 100]} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
                                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                <Bar dataKey="compliance" fill="var(--color-compliance)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Todos los Informes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Autor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentReportsData.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>{report.id}</TableCell>
                                        <TableCell className="font-medium">{report.title}</TableCell>
                                        <TableCell>{report.date}</TableCell>
                                        <TableCell>{report.author}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
