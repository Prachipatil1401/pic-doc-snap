# Quick Start Guide - USB Camera on Raspberry Pi

This guide gets your USB camera working with the plant disease app in 5 minutes.

## Step 1: Setup USB Camera (on Raspberry Pi)

```bash
# Make the setup script executable
chmod +x server/setup-usb-camera.sh

# Run the setup script
./server/setup-usb-camera.sh
```

This script will:
- Install required packages (`fswebcam`, `v4l-utils`)
- Detect your USB camera
- Test the camera
- Show supported resolutions

## Step 2: Configure Camera Server (on Raspberry Pi)

Create `server/.env` file:

```bash
cd server
nano .env
```

Add this content (adjust resolution if needed):

```env
CAMERA_TYPE=usb
USB_CAMERA_DEVICE=/dev/video0
CAMERA_RESOLUTION=1280x720
```

Save and exit (Ctrl+X, then Y, then Enter).

## Step 3: Install Dependencies (on Raspberry Pi)

```bash
# Install camera server dependencies
cd server
npm install

# Go back to project root
cd ..

# Install app dependencies
npm install
```

## Step 4: Start Camera Server (on Raspberry Pi)

```bash
cd server
npm start
```

**Important:** The server will display your Pi's IP address. Copy it!

Example output:
```
📱 Remote Access (from mobile phones on same network):
   http://192.168.1.100:3001

💡 Set this in your web app's .env.local:
   VITE_CAMERA_SERVER_URL=http://192.168.1.100:3001
```

## Step 5: Configure Web App (on Raspberry Pi)

Open a **new terminal** (keep camera server running) and:

```bash
# Create .env.local file
nano .env.local
```

Add this (use the IP address from Step 4):

```env
VITE_CAMERA_SERVER_URL=http://192.168.1.100:3001
```

Replace `192.168.1.100` with YOUR Pi's IP address!

Save and exit (Ctrl+X, then Y, then Enter).

## Step 6: Start Web App (on Raspberry Pi)

```bash
npm run dev
```

The app will start on port 8080 (or 5173).

## Step 7: Access from Mobile Phone

1. **Make sure your phone is on the same WiFi as the Pi**

2. **Open your phone's browser** and go to:
   ```
   http://192.168.1.100:8080
   ```
   (Replace `192.168.1.100` with your Pi's IP address)

3. **Click "Take Photo"** button - it will use the USB camera connected to the Pi!

## Troubleshooting

### Camera not detected
```bash
# Check if camera is connected
lsusb | grep -i camera

# Check video devices
ls /dev/video*
```

### Camera server won't start
```bash
# Check if port is in use
sudo lsof -ti:3001 | xargs kill -9

# Try again
cd server
npm start
```

### Can't access from phone
1. Verify Pi and phone are on same WiFi
2. Check Pi's firewall:
   ```bash
   sudo ufw allow 3001
   sudo ufw allow 8080
   ```
3. Try pinging the Pi from your phone's browser:
   ```
   http://192.168.1.100:3001/api/health
   ```
   You should see: `{"status":"ok","message":"Camera server is running"}`

### Wrong resolution or camera quality
Edit `server/.env` and try different resolutions:
```env
# Try these resolutions
CAMERA_RESOLUTION=1920x1080  # Full HD
CAMERA_RESOLUTION=1280x720   # HD (recommended)
CAMERA_RESOLUTION=640x480    # VGA
```

Check supported resolutions:
```bash
v4l2-ctl --device=/dev/video0 --list-formats-ext
```

### Multiple cameras
If you have multiple cameras:
```bash
# List all video devices
ls /dev/video*

# Use a different device in server/.env
USB_CAMERA_DEVICE=/dev/video1
```

## Auto-Start on Boot (Optional)

Once everything works, set it up to start automatically:

```bash
# Create camera server service
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
WorkingDirectory=/home/pi/pic-doc-snap/server
ExecStart=/usr/bin/node camera-server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl enable pi-camera.service
sudo systemctl start pi-camera.service
```

## Summary

✅ USB camera detected and tested  
✅ Camera server running on port 3001  
✅ Web app configured with Pi's IP  
✅ Web app running on port 8080  
✅ Accessible from mobile phones  

Now you can take photos with your Raspberry Pi camera from any mobile phone on the same network! 📸
