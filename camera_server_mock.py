"""
Mock camera server for testing without physical camera hardware.
Generates a simple test image (SVG) to simulate camera capture.
"""
from flask import Flask, jsonify
from flask_cors import CORS
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Simple SVG test image (avoids OpenCV dependency issues)
TEST_SVG = '''<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#2d3748"/>
  <text x="50%" y="35%" font-family="Arial" font-size="40" fill="#48bb78" text-anchor="middle">
    🎭 MOCK CAMERA TEST
  </text>
  <text x="50%" y="50%" font-family="Arial" font-size="28" fill="#e2e8f0" text-anchor="middle">
    PlantGuard Demo
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
</svg>'''

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "Camera server running (mock mode)"})

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "message": "Camera server is running"})

@app.route('/api/capture', methods=['POST', 'GET'])
def capture():
    """Capture one frame and return as base64 data URL"""
    # Convert SVG to base64
    svg_bytes = TEST_SVG.encode('utf-8')
    svg_b64 = base64.b64encode(svg_bytes).decode('utf-8')
    data_url = f"data:image/svg+xml;base64,{svg_b64}"
    
    return jsonify({
        "success": True,
        "image": data_url,
        "message": "Photo captured successfully (mock)"
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    print(f"\n{'='*60}")
    print(f"📸 Mock Camera Server (for testing without hardware)")
    print(f"{'='*60}")
    print(f"Local Access:  http://localhost:{port}")
    print(f"Network Access: http://0.0.0.0:{port}")
    print(f"{'='*60}\n")
    app.run(host='0.0.0.0', port=port, debug=False)
