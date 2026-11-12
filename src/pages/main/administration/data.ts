export type RecordRow = {
  cells: string[];
  clinic: string;
  status: string;
  href?: string;
};
export type ModuleData = {
  title: string;
  action: string;
  href?: string;
  headers: string[];
  rows: RecordRow[];
  fields: string[];
};
export const modules: Record<string, ModuleData> = {
  pacientes: {
    title: "Pacientes",
    action: "Nuevo paciente",
    headers: ["Paciente", "Contacto", "Cuenta digital", "Acción"],
    fields: ["Nombre completo", "Correo electrónico", "Clínica"],
    rows: [
      {
        cells: [
          "Santiago Izquierdo",
          "santiago@example.com",
          "Verificada",
          "Ver detalle",
        ],
        clinic: "Sede Central",
        status: "Verificada",
        href: "/pacientes",
      },
      {
        cells: [
          "María García",
          "maria@example.com",
          "Sin activar",
          "Enviar activación",
        ],
        clinic: "Sede Norte",
        status: "Sin activar",
      },
    ],
  },
  prevencion: {
    title: "Prevención dental",
    action: "Crear evento",
    headers: ["Paciente", "Evento / fecha", "Estado", "Acción"],
    fields: ["Paciente", "Tipo de cuidado", "Fecha", "Clínica"],
    rows: [
      {
        cells: [
          "Santiago Izquierdo",
          "Limpieza · 15 nov 2026",
          "Programado",
          "Ver línea temporal",
        ],
        clinic: "Sede Central",
        status: "Programado",
        href: "/pacientes",
      },
      {
        cells: [
          "María García",
          "Evaluación · 16 nov 2026",
          "Futuro",
          "Editar evento",
        ],
        clinic: "Sede Norte",
        status: "Futuro",
      },
      {
        cells: [
          "Santiago Izquierdo",
          "Limpieza · 15 may 2026",
          "Realizado",
          "Ver detalle",
        ],
        clinic: "Sede Central",
        status: "Realizado",
        href: "/pacientes",
      },
    ],
  },
  auditoria: {
    title: "Auditoría",
    action: "Filtrar actividad",
    headers: ["Fecha / actor", "Recurso", "Cambio", "Detalle"],
    fields: [],
    rows: [
      {
        cells: [
          "28 oct · Ana López",
          "Membresía BC-0001",
          "Pendiente → Activa",
          "Ver cambios",
        ],
        clinic: "Sede Central",
        status: "Membresía",
      },
      {
        cells: [
          "28 oct · Luis Martínez",
          "Consumo #102",
          "Limpieza registrada",
          "Ver responsable",
        ],
        clinic: "Sede Central",
        status: "Consumo",
      },
      {
        cells: [
          "27 oct · Ana López",
          "Permisos",
          "Sede Norte añadida",
          "Ver antes / después",
        ],
        clinic: "Sede Norte",
        status: "Permisos",
      },
    ],
  },
};
