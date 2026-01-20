import { useTheme } from "~/components/theme/theme-provider";
import { useEffect, useState } from "react";

export function useDotGridStyle() {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === "system") {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Light mode: coral dots on cream background
  // Dark mode: muted coral dots on charcoal background
  return {
    backgroundImage: `radial-gradient(circle, oklch(0.65 0.08 30 / ${isDark ? "0.15" : "0.25"}) 1.5px, transparent 1.5px)`,
    backgroundSize: "20px 20px",
    backgroundColor: isDark ? "oklch(0.13 0.005 30)" : "oklch(0.98 0.01 90)",
  };
}
