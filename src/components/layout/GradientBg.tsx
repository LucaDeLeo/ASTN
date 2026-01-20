import { cn } from "~/lib/utils";

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
  const gradients = {
    radial: `radial-gradient(ellipse at center, oklch(0.99 0.01 90) 0%, oklch(0.97 0.02 30) 70%, oklch(0.95 0.04 30) 100%)`,
    linear: `linear-gradient(135deg, oklch(0.99 0.01 90) 0%, oklch(0.97 0.02 30) 100%)`,
    subtle: `linear-gradient(180deg, oklch(0.99 0.005 90) 0%, oklch(0.98 0.01 85) 100%)`,
  };

  // Noise texture SVG (2-3% opacity for subtle warmth)
  const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`;

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
