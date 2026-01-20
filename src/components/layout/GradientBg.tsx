import { cn } from "~/lib/utils";
import { useTheme } from "~/components/theme/theme-provider";
import { useEffect, useState } from "react";

interface GradientBgProps {
  variant?: "radial" | "linear" | "subtle";
  children: React.ReactNode;
  className?: string;
}

export function GradientBg({
  variant = "radial",
  children,
  className,
}: GradientBgProps) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Determine effective theme
    if (theme === "system") {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Light mode gradients - warm cream tones
  const lightGradients = {
    radial: `radial-gradient(ellipse at center, oklch(0.99 0.01 90) 0%, oklch(0.97 0.02 30) 70%, oklch(0.95 0.04 30) 100%)`,
    linear: `linear-gradient(135deg, oklch(0.99 0.01 90) 0%, oklch(0.97 0.02 30) 100%)`,
    subtle: `linear-gradient(180deg, oklch(0.99 0.005 90) 0%, oklch(0.98 0.01 85) 100%)`,
  };

  // Dark mode gradients - soft charcoal with subtle coral undertones
  // Values aligned with CSS tokens: background is 0.16, card is 0.22
  // Gradient goes from elevated center (0.22) to background (0.16) - visible elevation
  const darkGradients = {
    radial: `radial-gradient(ellipse at center, oklch(0.22 0.008 30) 0%, oklch(0.18 0.006 30) 60%, oklch(0.16 0.005 30) 100%)`,
    linear: `linear-gradient(135deg, oklch(0.20 0.008 30) 0%, oklch(0.16 0.005 30) 100%)`,
    subtle: `linear-gradient(180deg, oklch(0.19 0.006 30) 0%, oklch(0.16 0.005 30) 100%)`,
  };

  const gradients = isDark ? darkGradients : lightGradients;

  // Noise texture SVG (2-3% opacity for subtle warmth, 1% in dark mode)
  const noiseOpacity = isDark ? "0.01" : "0.03";
  const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${noiseOpacity}'/%3E%3C/svg%3E")`;

  return (
    <div
      className={cn("min-h-screen", className)}
      style={{
        background: gradients[variant],
        backgroundImage: `${gradients[variant]}, ${noise}`,
      }}
    >
      {children}
    </div>
  );
}
