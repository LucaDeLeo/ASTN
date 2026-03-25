export interface DotGridStyle {
  backgroundImage: string
  backgroundSize: string
  backgroundColor: string
}

export function createDotGridStyle(): DotGridStyle {
  return {
    backgroundImage: `radial-gradient(circle, oklch(0.65 0.08 30 / 0.25) 1.5px, transparent 1.5px)`,
    backgroundSize: '20px 20px',
    backgroundColor: 'oklch(0.98 0.01 90)',
  }
}

export function useDotGridStyle() {
  return createDotGridStyle()
}
