import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.picdocsnap.app',
  appName: 'PicDocSnap',
  webDir: 'dist',
  server: {
    url: 'https://5482adab-2c38-45cd-a7a6-ba3377ac103c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
