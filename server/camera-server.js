import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for all origins (mobile phones on same network)
app.use(cors());
app.use(express.json());

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

    // Use libcamera-still for modern Pi OS or raspistill for older versions
    // Try libcamera-still first
    let command = `libcamera-still -o ${filepath} --width 1920 --height 1080 --timeout 1`;
    
    try {
      console.log('Attempting to capture with libcamera-still...');
      await execAsync(command);
      console.log('Photo captured successfully with libcamera-still');
    } catch (libcameraError) {
      // Fallback to raspistill for older Pi OS
      console.log('libcamera-still failed, trying raspistill...');
      command = `raspistill -o ${filepath} -w 1920 -h 1080 -t 1`;
      await execAsync(command);
      console.log('Photo captured successfully with raspistill');
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

// Start server
async function startServer() {
  await ensureTempDir();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎥 Raspberry Pi Camera Server running on port ${PORT}`);
    console.log(`📱 Mobile devices can access at http://<pi-ip-address>:${PORT}`);
    console.log(`📸 Camera endpoint: POST /api/capture`);
  });
}

startServer().catch(console.error);
