import type { CapacitorConfig } from '@capacitor/cli';

// Your live Vercel deployment URL
const APP_URL = (process.env.CAPACITOR_APP_URL || 'https://mynightcap.vercel.app').replace(/\/$/, '');

const config: CapacitorConfig = {
  appId: 'com.mynightcap.app',
  appName: 'NightCapt',
  webDir: 'www',
  appendUserAgent: 'NightCaptApp',
  backgroundColor: '#1e1b24',
  server: {
    // Open feed directly — skips an extra redirect for signed-in users
    url: `${APP_URL}/feed`,
    cleartext: false,
    allowNavigation: [
      APP_URL,
      `${APP_URL}/`,
      'https://wnnpbjwtmayzfcdduvhq.supabase.co',
      'https://*.supabase.co',
      'https://*.vercel.app',
    ],
  },
  ios: {
    backgroundColor: '#1e1b24',
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#1e1b24',
      showSpinner: true,
      spinnerColor: '#ff6b9d',
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1e1b24',
    },
  },
};

export default config;
