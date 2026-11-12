import {
  BoxIcon,
  LayerIcon,
  LayoutGridIcon,
  MapIcon,
  PlusIcon,
  StarIcon,
} from "@/icons";

export const clinicIcons = {
  clinic: BoxIcon,
  cross: PlusIcon,
  pin: MapIcon,
  star: StarIcon,
  grid: LayoutGridIcon,
  layers: LayerIcon,
};
export const clinicColors = {
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  violet:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200",
  slate: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};
export type ClinicIcon = keyof typeof clinicIcons;
export type ClinicColor = keyof typeof clinicColors;
