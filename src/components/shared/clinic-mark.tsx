import { cn } from "@/utils";
import {
  clinicIcons,
  clinicColors,
  type ClinicIcon,
  type ClinicColor,
} from "./clinic-appearance";

export function ClinicMark({
  icon = "clinic",
  color = "teal",
  className,
}: {
  icon?: ClinicIcon;
  color?: ClinicColor;
  className?: string;
}) {
  const Icon = clinicIcons[icon] ?? clinicIcons.clinic;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
        clinicColors[color] ?? clinicColors.teal,
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
