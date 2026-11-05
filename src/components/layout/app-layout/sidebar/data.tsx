import {
  LayoutGridIcon,
  UsersIcon,
  UserCircleIcon,
  CalendarIcon,
  PageIcon,
  GearIcon,
  CheckCircleIcon,
  ListIcon,
  LogOutIcon,
  BoxIcon,
} from "@/icons";
import type { NavItem } from "./types";
export const navItems: NavItem[] = [
  { key: "Resumen", path: "/", icon: <LayoutGridIcon /> },
  { key: "Pacientes", path: "/pacientes", icon: <UsersIcon /> },
  { key: "Membresías", path: "/membresias", icon: <UserCircleIcon /> },
  { key: "Planes", path: "/planes", icon: <PageIcon /> },
  { key: "Beneficios", path: "/beneficios", icon: <CheckCircleIcon /> },
  { key: "Prevención", path: "/prevencion", icon: <CalendarIcon /> },
  { key: "Clínicas", path: "/clinicas", icon: <BoxIcon /> },
  { key: "Usuarios y permisos", path: "/usuarios", icon: <GearIcon /> },
  { key: "Auditoría", path: "/auditoria", icon: <ListIcon /> },
  { key: "Cerrar sesión", path: "/iniciar-sesion", icon: <LogOutIcon /> },
];
export const othersItems: NavItem[] = [];
export const supportItems: NavItem[] = [];
