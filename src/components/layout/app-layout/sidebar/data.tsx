import { peopleMessages, sessionMessages } from "@/lib/session-messages";
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
  {
    key: sessionMessages().myAccount,
    path: "/mi-cuenta",
    icon: <UserCircleIcon />,
  },
  { key: "Resumen", path: "/", icon: <LayoutGridIcon /> },
  { key: peopleMessages().patients, path: "/pacientes", icon: <UsersIcon /> },
  { key: "Membresías", path: "/membresias", icon: <UserCircleIcon /> },
  { key: "Planes", path: "/planes", icon: <PageIcon /> },
  { key: "Beneficios", path: "/beneficios", icon: <CheckCircleIcon /> },
  { key: "Prevención", path: "/prevencion", icon: <CalendarIcon /> },
  { key: "Clínicas", path: "/clinicas", icon: <BoxIcon /> },
  {
    key: peopleMessages().collaborators,
    path: "/colaboradores",
    icon: <GearIcon />,
  },
  { key: "Auditoría", path: "/auditoria", icon: <ListIcon /> },
  { key: "Cerrar sesión", path: "/iniciar-sesion", icon: <LogOutIcon /> },
];
export const othersItems: NavItem[] = [];
export const supportItems: NavItem[] = [];
