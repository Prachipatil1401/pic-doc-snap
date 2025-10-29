# Raspberry Pi Camera Setup Guide

This guide will help you set up the plant disease detection app on your Raspberry Pi with a camera module.

## Prerequisites

- Raspberry Pi 4 (or Pi 3/Zero 2 W)
- Raspberry Pi Camera Module (v2, v3, or HQ camera)
- Node.js 18+ installed
- Camera enabled in Pi configuration

## 1. Enable the Camera

```bash
sudo raspi-config
```

Navigate to: `Interface Options` → `Camera` → `Enable`

Reboot your Pi:
```bash
sudo reboot
```

## 2. Test Camera Connection

For modern Pi OS (Bullseye or newer):
```bash
libcamera-still -o test.jpg
```

For older Pi OS:
```bash
raspistill -o test.jpg
```

If you see a test.jpg file, your camera is working!

## 3. Install the Project

### Option A: Via GitHub (Recommended)

1. Clone the repository:
```bash
cd ~
git clone <your-github-repo-url> plant-disease-app
cd plant-disease-app
```

2. Install dependencies:
```bash
npm install
```

3. Install camera server dependencies:
```bash
cd server
npm install
cd ..
```

### Option B: Manual Transfer

1. Copy your project files to the Pi
2. Install dependencies as above

## 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration (already in .env)
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-key>

# Camera Server URL (for mobile access)
VITE_CAMERA_SERVER_URL=http://<your-pi-ip>:3001
```

To find your Pi's IP address:
```bash
hostname -I
```

Example: `VITE_CAMERA_SERVER_URL=http://192.168.1.100:3001`

## 5. Start the Services

You'll need to run TWO services:

### Terminal 1: Camera Server
```bash
cd server
npm start
```

This starts the camera API on port 3001.

### Terminal 2: Web App
```bash
npm run dev
```

This starts the web app on port 8080.

## 6. Access from Mobile Phones

From any phone on the same WiFi network, open a browser and go to:

```
http://<your-pi-ip>:8080
```

Example: `http://192.168.1.100:8080`

## 7. Auto-Start on Boot (Optional)

To make the services start automatically when Pi boots:

### Create systemd service for camera server:

```bash
sudo nano /etc/systemd/system/pi-camera.service
```

Add:
```ini
[Unit]
Description=Pi Camera Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/plant-disease-app/server
ExecStart=/usr/bin/node camera-server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Create systemd service for web app:

```bash
sudo nano /etc/systemd/system/plant-app.service
```

Add:
```ini
[Unit]
Description=Plant Disease Detection App
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/plant-disease-app
ExecStart=/usr/bin/npm run dev
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Enable and start services:

```bash
sudo systemctl enable pi-camera.service
sudo systemctl enable plant-app.service
sudo systemctl start pi-camera.service
sudo systemctl start plant-app.service
```

### Check status:

```bash
sudo systemctl status pi-camera.service
sudo systemctl status plant-app.service
```

## 8. Building Native Android App (Optional)

If you want a native Android app that connects to your Pi:

1. On your development machine (not the Pi), clone the project
2. Install dependencies: `npm install`
3. Add Android platform: `npx cap add android`
4. Update capacitor config to point to your Pi:

Edit `capacitor.config.ts`:
```typescript
server: {
  url: "http://192.168.1.100:8080", // Your Pi's IP
  cleartext: true
}
```

5. Build and sync:
```bash
npm run build
npx cap sync android
npx cap open android
```

6. In Android Studio, build and install the APK

## Troubleshooting

### Camera not working
```bash
# Check camera detection
vcgencmd get_camera

# Should show: supported=1 detected=1
```

### Port already in use
```bash
# Kill processes on ports
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:8080 | xargs kill -9
```

### Cannot access from mobile
- Ensure Pi and phone are on same WiFi network
- Check Pi's firewall settings
- Try accessing `http://<pi-ip>:8080` from Pi's browser first

### Camera server errors
Check logs:
```bash
sudo journalctl -u pi-camera.service -f
```

## Network Architecture

```
Mobile Phone (Browser/App)
    ↓
    ↓ HTTP Request (Take Photo)
    ↓
Raspberry Pi :8080 (Web App)
    ↓
    ↓ Calls local API
    ↓
Raspberry Pi :3001 (Camera Server)
    ↓
    ↓ Captures via libcamera/raspistill
    ↓
Pi Camera Module
    ↓
    ↓ Returns base64 image
    ↓
Web App → Supabase Edge Function (Disease Detection)
    ↓
Results shown on Mobile Phone
```

## Tips

1. **For best performance**: Use a Pi 4 with 4GB+ RAM
2. **For faster loading**: Build the app (`npm run build`) and serve the dist folder with nginx
3. **For better camera quality**: Adjust camera settings in `server/camera-server.js`
4. **For remote access**: Set up port forwarding or use ngrok/tailscale

## Support

If you encounter issues:
1. Check camera is enabled: `vcgencmd get_camera`
2. Check services are running: `sudo systemctl status pi-camera.service`
3. Check logs: `journalctl -u pi-camera.service -f`
4. Verify network connectivity from mobile device
