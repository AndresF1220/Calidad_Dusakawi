
export type SubprocesoSeed = {
    nombre: string;
}

export type ProcesoSeed = {
    id: string;
    nombre: string;
    subprocesos: SubprocesoSeed[];
}

export type AreaSeed = {
    id: string;
    titulo: string;
    procesos: ProcesoSeed[];
}


export const SEED_AREAS: AreaSeed[] = [
  {
    id: "financiera",
    titulo: "Dirección Administrativa y Financiera",
    procesos: [
      { id: "auditoria-cuentas-conciliaciones", nombre: "Auditoría de Cuentas y Conciliaciones (Cuentas Médicas)", subprocesos: [] },
      { id: "contabilidad", nombre: "Contabilidad", subprocesos: [{ nombre: "Presupuesto" }, { nombre: "Tesorería" }, { nombre: "Facturación y Recobro" }] },
      { id: "cartera", nombre: "Cartera", subprocesos: [] },
      { id: "sistemas-informacion", nombre: "Sistemas de Información", subprocesos: [] },
      { id: "gestion-documental", nombre: "Gestión Documental (Archivo)", subprocesos: [] },
      { id: "compras-servicios-suministros", nombre: "Compras de Servicios y Suministros (Almacén)", subprocesos: [] },
      { id: "radicacion-cuentas", nombre: "Radicación de Cuentas", subprocesos: [] },
      { id: "afiliacion-registro", nombre: "Afiliación y Registro (Aseguramiento)", subprocesos: [] },
      { id: "talento-humano", nombre: "Talento Humano", subprocesos: [{ nombre: "Selección y Desarrollo" }, { nombre: "Seguridad y Salud en el Trabajo" }, { nombre: "Bienestar Laboral" }, { nombre: "Compensación y Beneficios" }] },
    ],
  },
  {
    id: "gestion-riesgo",
    titulo: "Dirección de Gestión del Riesgo",
    procesos: [
      { id: "alto-costo", nombre: "Atención Complementaria y Alto Costo", subprocesos: [{ nombre: "Alto Costo" }, { nombre: "Auditoría Ambulatoria y Pertinencia Médica" }, { nombre: "Auditoría Concurrente" }, { nombre: "MIPRES" }] },
      { id: "baja-complejidad", nombre: "Baja Complejidad", subprocesos: [{ nombre: "Auditoría a la Atención Primaria" }] },
      { id: "autorizaciones", nombre: "Autorizaciones", subprocesos: [{ nombre: "Referencia y Contrarreferencia" }] },
      { id: "promocion-mantenimiento-salud", nombre: "Promoción y Mantenimiento de la Salud", subprocesos: [{ nombre: "Salud Pública" }, { nombre: "Epidemiología" }] },
      { id: "guias-bilingue-pacientes", nombre: "Gestión de Guías Bilingüe de Pacientes", subprocesos: [] },
    ],
  },
  {
    id: "intercultural",
    titulo: "Dirección de Participación Intercultural",
    procesos: [
      { id: "medicina-tradicional", nombre: "Medicina tradicional", subprocesos: [] },
      { id: "concertacion-participacion", nombre: "Concertación y Participación Comunitaria de la Prestación de Servicios", subprocesos: [] },
      { id: "defensoria-usuarios", nombre: "Defensoría y Representación de Miembro de la Comunidad (Defensoría de Usuarios)", subprocesos: [] },
      { id: "modelo-institucional", nombre: "Modelo Institucional", subprocesos: [] },
    ],
  },
  {
    id: "contratacion",
    titulo: "Contratación",
    procesos: [],
  },
  {
    id: "control-interno",
    titulo: "Control Interno",
    procesos: [],
  },
  {
    id: "gestion-calidad",
    titulo: "Gestión de Calidad",
    procesos: [
      { id: "siau", nombre: "SIAU", subprocesos: [] },
      { id: "auditoria-calidad", nombre: "Auditoría de Calidad", subprocesos: [] },
      { id: "interventoria", nombre: "Interventoría", subprocesos: [] },
      { id: "reporte-informacion", nombre: "Reporte de Información", subprocesos: [] },
    ],
  },
  {
    id: "asesoria-juridica",
    titulo: "Asesoría Jurídica",
    procesos: [],
  },
  {
    id: "sarlaft",
    titulo: "SARLAFT",
    procesos: [],
  },
  {
    id: "comunicaciones",
    titulo: "Comunicaciones",
    procesos: [],
  }
];
