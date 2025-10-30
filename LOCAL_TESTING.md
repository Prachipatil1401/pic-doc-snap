# Local Testing Guide

Test the complete camera functionality on your development machine before deploying to Raspberry Pi hardware.

## Quick Setup (2 minutes)

### 1. Configure Mock Mode

Create `server/.env` file:
```bash
cd server
cp .env.example .env
```

The default `.env.example` already has `MOCK_MODE=true` enabled.

### 2. Start Camera Server

```bash
cd server
npm install
node camera-server.js
```

You should see:
```
🚀 Camera Server Started Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📷 Mode: 🎭 MOCK (Testing)
📷 Camera Type: USB
📐 Resolution: 1280x720
🌐 Server Port: 3001
```

### 3. Configure Web App

Create `.env.local` in project root:
```bash
VITE_CAMERA_SERVER_URL=http://localhost:3001
```

### 4. Start Web App

In a new terminal:
```bash
npm install
npm run dev
```

### 5. Test the App

1. Open http://localhost:8080
2. Click **"Take Photo"** button
3. You should see a mock test image with timestamp
4. Click **"Analyze Image"** to test the AI detection

## What Gets Tested

✅ Camera server endpoints (`/api/health`, `/api/capture`)  
✅ Network communication between app and server  
✅ Image capture workflow  
✅ Error handling and timeouts  
✅ UI flow from capture to analysis  
✅ Cross-origin requests (CORS)

## Mock vs Real Camera

| Feature | Mock Mode | Real Camera |
|---------|-----------|-------------|
| Hardware Required | ❌ None | ✅ USB Camera or Pi Camera |
| Setup Time | 2 minutes | 15+ minutes |
| Image Output | SVG test image with timestamp | Real photo |
| Testing | Perfect for UI/workflow | Required for quality testing |

## Switching to Real Camera

Once you're ready to test with actual hardware:

1. **Deploy to Raspberry Pi** following `RASPBERRY_PI_SETUP.md`

2. **On Raspberry Pi**, edit `server/.env`:
   ```bash
   MOCK_MODE=false
   CAMERA_TYPE=usb
   USB_CAMERA_DEVICE=/dev/video0
   ```

3. **Restart camera server** on Pi

4. **Update `.env.local`** on your computer:
   ```bash
   VITE_CAMERA_SERVER_URL=http://192.168.1.XXX:3001
   ```
   (Replace with your Pi's actual IP address)

## Testing from Mobile Phone

1. Make sure your phone is on the **same WiFi network** as your computer
2. Find your computer's local IP address:
   - **Mac/Linux**: `ifconfig | grep "inet "`
   - **Windows**: `ipconfig`
3. Update `.env.local`:
   ```bash
   VITE_CAMERA_SERVER_URL=http://YOUR_COMPUTER_IP:3001
   ```
4. Access from phone: `http://YOUR_COMPUTER_IP:8080`

## Troubleshooting

### Camera server won't start
```bash
# Check if port 3001 is already in use
lsof -i :3001

# Use different port in server/.env
PORT=3002
```

### Web app can't connect to camera server
1. Verify camera server is running
2. Check `VITE_CAMERA_SERVER_URL` in `.env.local`
3. Test manually: `curl http://localhost:3001/api/health`

### CORS errors in browser console
- Camera server already has CORS enabled
- Make sure both services are running
- Try restarting both servers

## Next Steps

✅ Local testing complete  
➡️ Deploy to Raspberry Pi: See `RASPBERRY_PI_SETUP.md`  
➡️ USB Camera setup: See `USB_CAMERA_SETUP.md`  
➡️ Quick Pi setup: See `QUICK_START.md`
