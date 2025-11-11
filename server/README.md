# Flask Camera Server for Raspberry Pi

This is a Flask-based camera server that captures images from USB or CSI cameras on Raspberry Pi.

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. For USB cameras, install fswebcam:
```bash
sudo apt-get update
sudo apt-get install fswebcam
```

3. For CSI cameras, libcamera-still is usually pre-installed on recent Raspberry Pi OS. For older versions:
```bash
sudo apt-get install libraspberrypi-bin
```

## Configuration

Create a `.env` file in the `server` directory:

```env
# Server configuration
PORT=3001

# Set to true for testing without hardware
MOCK_MODE=false

# Camera type: 'usb' or 'csi'
CAMERA_TYPE=usb

# USB camera device (only for USB cameras)
USB_CAMERA_DEVICE=/dev/video0

# Resolution (e.g., 1280x720, 1920x1080)
CAMERA_RESOLUTION=1280x720
```

## Running the Server

### Option 1: Direct Python
```bash
python camera_server.py
```

### Option 2: Using Flask CLI
```bash
export FLASK_APP=camera_server.py
flask run --host=0.0.0.0 --port=3001
```

### Option 3: Make it run on boot (systemd service)
Create `/etc/systemd/system/camera-server.service`:
```ini
[Unit]
Description=Flask Camera Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/pic-doc-snap/server
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 /home/pi/pic-doc-snap/server/camera_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then enable and start:
```bash
sudo systemctl enable camera-server.service
sudo systemctl start camera-server.service
sudo systemctl status camera-server.service
```

## Testing

The server will display the local IP address when it starts. Use this URL in your web app's `.env.local`:
```
VITE_CAMERA_SERVER_URL=http://YOUR_PI_IP:3001
```

## API Endpoints

- `POST /api/capture` - Capture a photo
- `GET /api/health` - Check server status

## Troubleshooting

1. **Permission denied for camera**: Add your user to the video group
   ```bash
   sudo usermod -a -G video $USER
   ```

2. **USB camera not found**: List available devices
   ```bash
   ls /dev/video*
   ```

3. **CSI camera not working**: Enable the camera interface
   ```bash
   sudo raspi-config
   # Navigate to Interface Options > Camera > Enable
   ```
