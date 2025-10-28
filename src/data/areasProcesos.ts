export const AREAS = [
  {
    id: "financiera",
    titulo: "Dirección Administrativa y Financiera",
    procesos: [
      { id: "auditoria-cuentas-conciliaciones", nombre: "Auditoría de Cuentas y Conciliaciones (Cuentas Médicas)" },
      { id: "contabilidad", nombre: "Contabilidad" },
      { id: "cartera", nombre: "Cartera" },
      { id: "sistemas-informacion", nombre: "Sistemas de Información" },
      { id: "gestion-documental", nombre: "Gestión Documental (Archivo)" },
      { id: "compras-servicios-suministros", nombre: "Compras de Servicios y Suministros (Almacén)" },
      { id: "radicacion-cuentas", nombre: "Radicación de Cuentas" },
      { id: "afiliacion-registro", nombre: "Afiliación y Registro (Aseguramiento)" },
      { id: "talento-humano", nombre: "Talento Humano" },
    ],
  },
  {
    id: "gestion-riesgo",
    titulo: "Dirección de Gestión del Riesgo",
    procesos: [
      { id: "alto-costo", nombre: "Atención Complementaria y Alto Costo" },
      { id: "baja-complejidad", nombre: "Baja Complejidad" },
      { id: "autorizaciones", nombre: "Autorizaciones" },
      { id: "promocion-mantenimiento-salud", nombre: "Promoción y Mantenimiento de la Salud" },
      { id: "guias-bilingue-pacientes", nombre: "Gestión de Guías Bilingüe de Pacientes" },
    ],
  },
  {
    id: "intercultural",
    titulo: "Dirección de Participación Intercultural",
    procesos: [
      { id: "medicina-tradicional", nombre: "Medicina tradicional" },
      { id: "concertacion-participacion", nombre: "Concertación y Participación Comunitaria de la Prestación de Servicios" },
      { id: "defensoria-usuarios", nombre: "Defensoría y Representación de Miembro de la Comunidad (Defensoría de Usuarios)" },
      { id: "modelo-institucional", nombre: "Modelo Institucional" },
    ],
  },
  {
    id: "gestion-calidad",
    titulo: "Gestión de Calidad",
    procesos: [
      { id: "siau", nombre: "SIAU" },
      { id: "auditoria-calidad", nombre: "Auditoría de Calidad" },
      { id: "interventoria", nombre: "Interventoría" },
      { id: "reporte-informacion", nombre: "Reporte de Información" },
    ],
  },
];

/**
 * Finds an area by its ID.
 * @param id - The ID of the area to find.
 * @returns The area object or undefined if not found.
 */
export function getAreaById(id: string) {
  return AREAS.find(area => area.id === id);
}

/**
 * Finds a specific process within a specific area.
 * @param areaId - The ID of the area.
 * @param procesoId - The ID of the process to find.
 * @returns The process object or undefined if not found.
 */
export function getProceso(areaId: string, procesoId: string) {
  const area = getAreaById(areaId);
  if (!area) return undefined;
  return area.procesos.find(proceso => proceso.id === procesoId);
}