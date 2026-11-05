import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts";
import { MoonIcon, SunIcon } from "@/icons";
export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"
      }
      onClick={toggleTheme}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
