from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import base64
import os
import socket
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Enable CORS for all origins (mobile phones on same network)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration
PORT = int(os.getenv('PORT', 3001))
MOCK_MODE = os.getenv('MOCK_MODE', 'false').lower() == 'true'
CAMERA_TYPE = os.getenv('CAMERA_TYPE', 'csi')
USB_CAMERA_DEVICE = os.getenv('USB_CAMERA_DEVICE', '/dev/video0')
CAMERA_RESOLUTION = os.getenv('CAMERA_RESOLUTION', '1920x1080')

# Directory to temporarily store captured images
SCRIPT_DIR = Path(__file__).parent
TEMP_DIR = SCRIPT_DIR / 'temp'

# Ensure temp directory exists
TEMP_DIR.mkdir(exist_ok=True)

# Log server configuration on startup
print('=' * 50)
print('📸 Camera Server Configuration:')
print(f"   Mode: {'🎭 MOCK (Testing)' if MOCK_MODE else '📸 Real Camera'}")
print(f'   Camera Type: {CAMERA_TYPE}')
if CAMERA_TYPE == 'usb':
    print(f'   USB Device: {USB_CAMERA_DEVICE}')
print(f'   Resolution: {CAMERA_RESOLUTION}')
print('=' * 50)


def generate_mock_image():
    """Generate a mock image for testing without hardware"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    svg = f'''
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#2d3748"/>
      <text x="50%" y="35%" font-family="Arial" font-size="40" fill="#48bb78" text-anchor="middle">
        🎭 MOCK CAMERA TEST
      </text>
      <text x="50%" y="50%" font-family="Arial" font-size="28" fill="#e2e8f0" text-anchor="middle">
        {timestamp}
      </text>
      <text x="50%" y="62%" font-family="Arial" font-size="20" fill="#a0aec0" text-anchor="middle">
        This simulates a USB camera capture
      </text>
      <text x="50%" y="70%" font-family="Arial" font-size="18" fill="#718096" text-anchor="middle">
        Perfect for testing before deploying to hardware
      </text>
      <circle cx="640" cy="500" r="80" fill="#48bb78" opacity="0.3"/>
      <circle cx="640" cy="500" r="60" fill="#48bb78" opacity="0.5"/>
      <circle cx="640" cy="500" r="40" fill="#48bb78" opacity="0.7"/>
    </svg>
    '''
    
    base64_svg = base64.b64encode(svg.encode()).decode()
    return f'data:image/svg+xml;base64,{base64_svg}'


def get_local_ip():
    """Get the local IP address"""
    try:
        # Create a socket to determine the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return 'localhost'


@app.route('/api/capture', methods=['POST'])
def capture_photo():
    """Capture photo from Raspberry Pi camera"""
    try:
        print('Capture request received')
        
        # MOCK MODE - Return test image without hardware
        if MOCK_MODE:
            print('🎭 Mock mode: Generating test image...')
            mock_image = generate_mock_image()
            print('✅ Mock image generated successfully')
            return jsonify({
                'success': True,
                'image': mock_image,
                'message': 'Mock photo captured successfully',
                'mode': 'mock'
            })
        
        # REAL CAMERA MODE
        timestamp = int(datetime.now().timestamp() * 1000)
        filename = f'capture_{timestamp}.jpg'
        filepath = TEMP_DIR / filename
        
        capture_success = False
        
        if CAMERA_TYPE == 'usb':
            # USB Webcam using fswebcam
            print(f'Attempting to capture with USB webcam ({USB_CAMERA_DEVICE})...')
            command = [
                'fswebcam',
                '--device', USB_CAMERA_DEVICE,
                '-r', CAMERA_RESOLUTION,
                '--no-banner',
                str(filepath)
            ]
            
            try:
                subprocess.run(command, check=True, capture_output=True, text=True)
                print('Photo captured successfully with USB webcam')
                capture_success = True
            except subprocess.CalledProcessError as e:
                print(f'USB webcam capture failed: {e.stderr}')
                raise Exception('USB webcam not available. Make sure fswebcam is installed and camera is connected.')
        else:
            # CSI Camera Module - Try libcamera-still first, then raspistill
            width, height = CAMERA_RESOLUTION.split('x')
            
            try:
                print('Attempting to capture with libcamera-still...')
                command = [
                    'libcamera-still',
                    '-o', str(filepath),
                    '--width', width,
                    '--height', height,
                    '--timeout', '1'
                ]
                subprocess.run(command, check=True, capture_output=True, text=True)
                print('Photo captured successfully with libcamera-still')
                capture_success = True
            except (subprocess.CalledProcessError, FileNotFoundError):
                # Fallback to raspistill for older Pi OS
                print('libcamera-still failed, trying raspistill...')
                command = [
                    'raspistill',
                    '-o', str(filepath),
                    '-w', width,
                    '-h', height,
                    '-t', '1'
                ]
                try:
                    subprocess.run(command, check=True, capture_output=True, text=True)
                    print('Photo captured successfully with raspistill')
                    capture_success = True
                except (subprocess.CalledProcessError, FileNotFoundError):
                    print('Both libcamera and raspistill failed')
                    raise Exception('Camera not available. Make sure the camera is enabled and connected.')
        
        # Read the captured image and convert to base64
        with open(filepath, 'rb') as f:
            image_data = f.read()
        base64_image = base64.b64encode(image_data).decode()
        data_url = f'data:image/jpeg;base64,{base64_image}'
        
        # Clean up the temporary file
        filepath.unlink()
        
        print('Image converted to base64 and sent to client')
        
        return jsonify({
            'success': True,
            'image': data_url,
            'message': 'Photo captured successfully'
        })
        
    except Exception as e:
        print(f'Error capturing photo: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to capture photo. Make sure the camera is enabled and connected.'
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Camera server is running'
    })


if __name__ == '__main__':
    local_ip = get_local_ip()
    
    print('\n' + '=' * 60)
    print('🎥 Raspberry Pi Camera Server is RUNNING!')
    print('=' * 60)
    print(f'\n📡 Local Access:')
    print(f'   http://localhost:{PORT}')
    print(f'\n📱 Remote Access (from mobile phones on same network):')
    print(f'   http://{local_ip}:{PORT}')
    print(f'\n📸 Endpoints:')
    print(f'   POST /api/capture - Take a photo')
    print(f'   GET  /api/health  - Health check')
    print('\n' + '=' * 60)
    print(f'\n💡 Set this in your web app\'s .env.local:')
    print(f'   VITE_CAMERA_SERVER_URL=http://{local_ip}:{PORT}')
    print('=' * 60 + '\n')
    
    app.run(host='0.0.0.0', port=PORT, debug=False)
