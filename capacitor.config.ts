import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.safetytalent.app',
  appName: 'AI Safety Talent Network',
  webDir: 'dist',
  server: {
    url: 'https://safetytalent.org',
    cleartext: false,
  },
  ios: {
    scheme: 'ASTN',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
}

export default config
