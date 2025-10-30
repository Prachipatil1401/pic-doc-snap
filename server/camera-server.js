import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (mobile phones on same network)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log server configuration on startup
console.log('='.repeat(50));
console.log('📸 Camera Server Configuration:');
console.log(`   Camera Type: ${process.env.CAMERA_TYPE || 'csi'}`);
if (process.env.CAMERA_TYPE === 'usb') {
  console.log(`   USB Device: ${process.env.USB_CAMERA_DEVICE || '/dev/video0'}`);
}
console.log(`   Resolution: ${process.env.CAMERA_RESOLUTION || '1920x1080'}`);
console.log('='.repeat(50));

// Directory to temporarily store captured images
const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
}

// Capture photo from Raspberry Pi camera
app.post('/api/capture', async (req, res) => {
  try {
    console.log('Capture request received');
    
    const timestamp = Date.now();
    const filename = `capture_${timestamp}.jpg`;
    const filepath = path.join(TEMP_DIR, filename);

    // Check camera type from environment variable (default: CSI camera)
    const cameraType = process.env.CAMERA_TYPE || 'csi';
    const usbDevice = process.env.USB_CAMERA_DEVICE || '/dev/video0';
    const resolution = process.env.CAMERA_RESOLUTION || '1920x1080';

    let command;
    let captureSuccess = false;

    if (cameraType === 'usb') {
      // USB Webcam using fswebcam
      console.log(`Attempting to capture with USB webcam (${usbDevice})...`);
      command = `fswebcam --device ${usbDevice} -r ${resolution} --no-banner ${filepath}`;
      
      try {
        await execAsync(command);
        console.log('Photo captured successfully with USB webcam');
        captureSuccess = true;
      } catch (usbError) {
        console.error('USB webcam capture failed:', usbError.message);
        throw new Error('USB webcam not available. Make sure fswebcam is installed and camera is connected.');
      }
    } else {
      // CSI Camera Module - Try libcamera-still first, then raspistill
      const [width, height] = resolution.split('x');
      
      try {
        console.log('Attempting to capture with libcamera-still...');
        command = `libcamera-still -o ${filepath} --width ${width} --height ${height} --timeout 1`;
        await execAsync(command);
        console.log('Photo captured successfully with libcamera-still');
        captureSuccess = true;
      } catch (libcameraError) {
        // Fallback to raspistill for older Pi OS
        console.log('libcamera-still failed, trying raspistill...');
        command = `raspistill -o ${filepath} -w ${width} -h ${height} -t 1`;
        try {
          await execAsync(command);
          console.log('Photo captured successfully with raspistill');
          captureSuccess = true;
        } catch (raspistillError) {
          console.error('Both libcamera and raspistill failed');
          throw new Error('Camera not available. Make sure the camera is enabled and connected.');
        }
      }
    }

    // Read the captured image and convert to base64
    const imageBuffer = await fs.readFile(filepath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Clean up the temporary file
    await fs.unlink(filepath);

    console.log('Image converted to base64 and sent to client');
    
    res.json({
      success: true,
      image: dataUrl,
      message: 'Photo captured successfully'
    });

  } catch (error) {
    console.error('Error capturing photo:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to capture photo. Make sure the camera is enabled and connected.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Camera server is running' });
});

// Get local IP address
function getLocalIPAddress() {
  const { networkInterfaces } = await import('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Start server
async function startServer() {
  await ensureTempDir();
  
  const localIP = await getLocalIPAddress();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🎥 Raspberry Pi Camera Server is RUNNING!');
    console.log('='.repeat(60));
    console.log(`\n📡 Local Access:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`\n📱 Remote Access (from mobile phones on same network):`);
    console.log(`   http://${localIP}:${PORT}`);
    console.log(`\n📸 Endpoints:`);
    console.log(`   POST /api/capture - Take a photo`);
    console.log(`   GET  /api/health  - Health check`);
    console.log('\n' + '='.repeat(60));
    console.log(`\n💡 Set this in your web app's .env.local:`);
    console.log(`   VITE_CAMERA_SERVER_URL=http://${localIP}:${PORT}`);
    console.log('='.repeat(60) + '\n');
  });
}

startServer().catch(console.error);
