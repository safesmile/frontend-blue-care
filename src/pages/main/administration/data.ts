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
        href: "/pacientes/santiago-izquierdo",
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
  membresias: {
    title: "Membresías",
    action: "Asignar membresía",
    href: "/membresias/asignar",
    headers: ["Miembro", "Plan / versión", "Vigencia", "Estado"],
    fields: [],
    rows: [
      {
        cells: [
          "Santiago Izquierdo",
          "Blue Care+ · v1",
          "30 may 2027",
          "Activo",
        ],
        clinic: "Sede Central",
        status: "Activo",
        href: "/membresias/asignar",
      },
      {
        cells: ["María García", "Blue Care+ · v1", "15 nov 2026", "Por vencer"],
        clinic: "Sede Norte",
        status: "Por vencer",
        href: "/membresias/asignar",
      },
      {
        cells: ["Carlos Pérez", "Blue Care+ · v1", "20 oct 2026", "Vencido"],
        clinic: "Sede Central",
        status: "Vencido",
        href: "/membresias/asignar",
      },
    ],
  },
  planes: {
    title: "Planes y versiones",
    action: "Crear plan",
    headers: ["Plan", "Versión", "Publicación", "Acción"],
    fields: ["Nombre del plan", "Descripción"],
    rows: [
      {
        cells: [
          "Blue Care+",
          "v1 · Contratos vigentes",
          "Publicado",
          "Consultar",
        ],
        clinic: "Sede Central",
        status: "Publicado",
        href: "/planes/blue-care/beneficios",
      },
      {
        cells: ["Blue Care+", "v2 · Nuevas condiciones", "Borrador", "Editar"],
        clinic: "Sede Norte",
        status: "Borrador",
        href: "/planes/blue-care/beneficios",
      },
      {
        cells: ["Plan anterior", "v1 · Histórico", "Inactivo", "Consultar"],
        clinic: "Sede Central",
        status: "Inactivo",
        href: "/planes/blue-care/beneficios",
      },
    ],
  },
  beneficios: {
    title: "Beneficios y consumos",
    action: "Consultar paciente",
    href: "/pacientes/santiago-izquierdo",
    headers: ["Paciente / beneficio", "Utilizados", "Restantes", "Acción"],
    fields: [],
    rows: [
      {
        cells: ["Santiago · Limpieza", "1 de 2", "1", "Registrar consumo"],
        clinic: "Sede Central",
        status: "Disponible",
        href: "/beneficios/registrar-consumo",
      },
      {
        cells: ["Santiago · Evaluación", "0 de 1", "1", "Registrar consumo"],
        clinic: "Sede Central",
        status: "Disponible",
        href: "/beneficios/registrar-consumo",
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
        href: "/pacientes/santiago-izquierdo",
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
        href: "/pacientes/santiago-izquierdo",
      },
    ],
  },
  clinicas: {
    title: "Clínicas",
    action: "Nueva clínica",
    headers: ["Clínica", "Ubicación", "Estado", "Acción"],
    fields: ["Nombre de la clínica", "Ubicación"],
    rows: [
      {
        cells: ["Sede Central", "Guatemala · Ejemplo", "Activa", "Editar"],
        clinic: "Sede Central",
        status: "Activa",
      },
      {
        cells: ["Sede Norte", "Guatemala · Ejemplo", "Activa", "Editar"],
        clinic: "Sede Norte",
        status: "Activa",
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
