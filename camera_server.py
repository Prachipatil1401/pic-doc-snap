from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
import base64
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize camera (use 0 for USB webcam, or adjust if needed)
camera = cv2.VideoCapture(0)

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "Camera server running"})

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "message": "Camera server is running"})

@app.route('/api/capture', methods=['POST', 'GET'])
def capture():
    """Capture one frame and return as base64 data URL"""
    success, frame = camera.read()
    if success:
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        if ret:
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            data_url = f"data:image/jpeg;base64,{jpg_as_text}"
            return jsonify({
                "success": True,
                "image": data_url,
                "message": "Photo captured successfully"
            })
        else:
            return jsonify({"success": False, "error": "Failed to encode image"}), 500
    else:
        return jsonify({"success": False, "error": "Failed to capture image from camera"}), 500


if __name__ == '__main__':
    # Run Flask server on port 3001
    port = int(os.getenv('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=False)
