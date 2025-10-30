# USB Camera Setup for Raspberry Pi

Complete guide to connect a USB webcam to your Raspberry Pi and use it with the plant disease detection app remotely from mobile phones.

## 🎯 What You'll Achieve

- USB webcam connected to Raspberry Pi
- Camera server running on Pi
- Mobile phones can access the app via WiFi
- "Take Photo" button triggers Pi's camera remotely
- AI analyzes the photo and shows results on mobile

## 📋 Prerequisites

- Raspberry Pi 4 (or Pi 3/Zero 2 W)
- USB webcam
- WiFi network (Pi and mobile phones on same network)
- Node.js 18+ installed on Pi

## 🚀 Quick Setup (5 Minutes)

### 1. Run Setup Script on Raspberry Pi

```bash
chmod +x server/setup-usb-camera.sh
./server/setup-usb-camera.sh
```

This will:
- ✅ Install `fswebcam` and `v4l-utils`
- ✅ Detect your USB camera
- ✅ Test camera capture
- ✅ Show supported resolutions

### 2. Configure Camera

Create `server/.env`:

```bash
CAMERA_TYPE=usb
USB_CAMERA_DEVICE=/dev/video0
CAMERA_RESOLUTION=1280x720
```

### 3. Install Dependencies

```bash
cd server
npm install
cd ..
npm install
```

### 4. Start Camera Server

```bash
cd server
npm start
```

**📝 IMPORTANT:** Copy the IP address shown in the output!

Example:
```
📱 Remote Access: http://192.168.1.100:3001
💡 Set this in .env.local: VITE_CAMERA_SERVER_URL=http://192.168.1.100:3001
```

### 5. Configure Web App

Create `.env.local` in project root:

```bash
VITE_CAMERA_SERVER_URL=http://192.168.1.100:3001
```

⚠️ **Use YOUR Pi's IP address from step 4!**

### 6. Start Web App

Open a **new terminal** (keep camera server running):

```bash
npm run dev
```

### 7. Access from Mobile

On your phone's browser, go to:
```
http://192.168.1.100:8080
```

(Use your Pi's IP address)

Click **"Take Photo"** - it will use the Pi's USB camera! 📸

## 🔧 Detailed Configuration

### Camera Type Options

**CSI Camera (Ribbon Cable):**
```bash
CAMERA_TYPE=csi
CAMERA_RESOLUTION=1920x1080
```

**USB Webcam:**
```bash
CAMERA_TYPE=usb
USB_CAMERA_DEVICE=/dev/video0
CAMERA_RESOLUTION=1280x720
```

### Finding USB Camera Device

```bash
# List all video devices
ls /dev/video*

# Check which is your camera
v4l2-ctl --list-devices

# Test different devices
fswebcam --device /dev/video0 test0.jpg
fswebcam --device /dev/video1 test1.jpg
```

### Supported Resolutions

```bash
# Check what your camera supports
v4l2-ctl --device=/dev/video0 --list-formats-ext

# Common resolutions:
# 1920x1080 (Full HD) - Best quality, slower
# 1280x720 (HD) - Recommended balance
# 640x480 (VGA) - Fastest, lower quality
```

### Multiple Cameras

If you have multiple USB cameras:

```bash
# List all cameras
ls -l /dev/video*

# Configure specific camera in server/.env
USB_CAMERA_DEVICE=/dev/video1  # Use second camera
```

## 📱 Network Architecture

```
┌─────────────┐
│ Mobile Phone│
│  (Browser)  │
└──────┬──────┘
       │ WiFi
       │ http://192.168.1.100:8080
       ↓
┌──────────────────────┐
│  Raspberry Pi        │
│  ┌────────────────┐  │
│  │  Web App       │  │
│  │  Port 8080     │  │
│  └────────┬───────┘  │
│           │          │
│  ┌────────↓───────┐  │
│  │  Camera Server │  │
│  │  Port 3001     │  │
│  └────────┬───────┘  │
│           │          │
│  ┌────────↓───────┐  │
│  │  USB Webcam    │  │
│  │  /dev/video0   │  │
│  └────────────────┘  │
└──────────────────────┘
```

## ❓ Troubleshooting

### Camera Not Detected

```bash
# Check USB connection
lsusb | grep -i camera

# Check video devices
ls /dev/video*

# Install drivers if needed
sudo apt install v4l-utils
```

### Permission Denied

```bash
# Add user to video group
sudo usermod -a -G video $USER

# Logout and login again
```

### Camera Server Won't Start

```bash
# Check if port is in use
sudo lsof -ti:3001 | xargs kill -9

# Check for errors
cd server
DEBUG=* npm start
```

### Can't Access from Phone

**Check 1: Same WiFi Network**
```bash
# On Pi, check network
hostname -I
ifconfig wlan0
```

**Check 2: Firewall**
```bash
# Allow ports through firewall
sudo ufw allow 3001
sudo ufw allow 8080

# Or disable firewall for testing
sudo ufw disable
```

**Check 3: Test Health Endpoint**

From phone's browser:
```
http://192.168.1.100:3001/api/health
```

Should show: `{"status":"ok","message":"Camera server is running"}`

**Check 4: CORS Issues**

If you see CORS errors, verify `server/camera-server.js` has:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
}));
```

### Poor Image Quality

**Try different resolutions:**
```bash
# In server/.env, try:
CAMERA_RESOLUTION=1920x1080  # Higher quality
CAMERA_RESOLUTION=1280x720   # Balanced (recommended)
CAMERA_RESOLUTION=640x480    # Faster capture
```

**Adjust camera settings:**
```bash
# Check current settings
v4l2-ctl --device=/dev/video0 --all

# Adjust brightness/contrast (example)
v4l2-ctl --device=/dev/video0 --set-ctrl=brightness=128
v4l2-ctl --device=/dev/video0 --set-ctrl=contrast=128
```

### Slow Capture

1. **Lower resolution** in `server/.env`:
   ```
   CAMERA_RESOLUTION=640x480
   ```

2. **Check Pi's CPU usage**:
   ```bash
   htop
   ```

3. **Close other applications** on Pi

### Wrong Camera Selected

```bash
# List all cameras with details
v4l2-ctl --list-devices

# Test each one
fswebcam --device /dev/video0 test0.jpg
fswebcam --device /dev/video1 test1.jpg

# Update server/.env with correct device
USB_CAMERA_DEVICE=/dev/video1
```

## 🔄 Auto-Start on Boot

To make services start automatically when Pi boots:

### Camera Server Service

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
WorkingDirectory=/home/pi/pic-doc-snap/server
ExecStart=/usr/bin/node camera-server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable pi-camera.service
sudo systemctl start pi-camera.service
sudo systemctl status pi-camera.service
```

### Web App Service

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
WorkingDirectory=/home/pi/pic-doc-snap
ExecStart=/usr/bin/npm run dev
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable plant-app.service
sudo systemctl start plant-app.service
```

## 📊 Testing Checklist

- [ ] USB camera detected with `lsusb`
- [ ] Video device exists at `/dev/video0`
- [ ] Test image captured with `fswebcam`
- [ ] `server/.env` configured correctly
- [ ] Camera server starts without errors
- [ ] Server shows Pi's IP address
- [ ] `.env.local` has correct `VITE_CAMERA_SERVER_URL`
- [ ] Web app starts on port 8080
- [ ] Health check works: `http://PI_IP:3001/api/health`
- [ ] Mobile phone on same WiFi network
- [ ] App accessible from phone: `http://PI_IP:8080`
- [ ] "Take Photo" button captures image from Pi camera
- [ ] Image appears in the app
- [ ] Disease detection works

## 🎓 Additional Resources

- **fswebcam documentation**: `man fswebcam`
- **v4l2-ctl guide**: `man v4l2-ctl`
- **Raspberry Pi camera setup**: https://www.raspberrypi.org/documentation/
- **USB webcam troubleshooting**: https://elinux.org/RPi_USB_Webcams

## 💡 Tips

1. **Use HD resolution (1280x720)** for best balance of quality and speed
2. **Good lighting** improves disease detection accuracy
3. **Keep Pi and phone on 5GHz WiFi** for faster response
4. **Use a powered USB hub** if camera disconnects
5. **Test camera first** before running the full app
6. **Check system logs** if things go wrong: `sudo journalctl -xe`

## 🆘 Still Having Issues?

1. Review the error messages in terminal
2. Check the browser console (F12) for errors
3. Verify all IP addresses are correct
4. Try restarting the Pi
5. Test camera independently with `fswebcam`
6. Check full setup guide in `RASPBERRY_PI_SETUP.md`

---

✨ Once setup is complete, you can control your Raspberry Pi camera from any mobile phone on the same network!
