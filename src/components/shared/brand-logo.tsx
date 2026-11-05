import { useTheme } from "@/contexts";
export function BrandLogo({ className = "w-40" }: { className?: string }) {
  const { theme } = useTheme();
  return (
    <img
      src={`/images/logo/logo-${theme}.png`}
      alt="Blue Care Meds — Salud que llega a ti"
      className={`h-auto object-contain ${className}`}
    />
  );
}
