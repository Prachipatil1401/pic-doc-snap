#!/bin/bash

# Raspberry Pi USB Camera Setup Script
# This script helps set up a USB webcam for the plant disease detection app

echo "=================================================="
echo "  Raspberry Pi USB Camera Setup"
echo "=================================================="
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
  echo "⚠️  Warning: This doesn't appear to be a Raspberry Pi"
  echo "   Continuing anyway..."
  echo ""
fi

# Install required packages
echo "📦 Installing required packages..."
sudo apt update
sudo apt install -y fswebcam v4l-utils

echo ""
echo "✅ Packages installed!"
echo ""

# Check for USB cameras
echo "🔍 Checking for USB cameras..."
if lsusb | grep -i "camera\|webcam\|video" > /dev/null; then
  echo "✅ USB camera detected:"
  lsusb | grep -i "camera\|webcam\|video"
else
  echo "❌ No USB camera detected!"
  echo "   Please connect a USB webcam and run this script again."
  exit 1
fi

echo ""

# List video devices
echo "📹 Available video devices:"
ls -l /dev/video* 2>/dev/null || echo "   No video devices found!"

echo ""

# Test the first available camera
VIDEO_DEVICE="/dev/video0"
if [ -e "$VIDEO_DEVICE" ]; then
  echo "🧪 Testing camera: $VIDEO_DEVICE"
  
  # Get camera capabilities
  echo ""
  echo "📊 Camera capabilities:"
  v4l2-ctl --device=$VIDEO_DEVICE --all | grep -E "Width/Height|Pixel Format" | head -5
  
  echo ""
  echo "📸 Supported resolutions:"
  v4l2-ctl --device=$VIDEO_DEVICE --list-formats-ext | grep -E "Size|Interval" | head -10
  
  echo ""
  echo "📷 Taking test photo..."
  TEST_IMAGE="$HOME/camera-test-$(date +%s).jpg"
  fswebcam --device $VIDEO_DEVICE -r 1280x720 --no-banner "$TEST_IMAGE" 2>/dev/null
  
  if [ -f "$TEST_IMAGE" ]; then
    echo "✅ Test photo captured successfully!"
    echo "   Saved to: $TEST_IMAGE"
    echo ""
    echo "🎉 Your USB camera is working!"
  else
    echo "❌ Failed to capture test photo"
    echo "   Try a different resolution or device"
  fi
else
  echo "❌ No video device found at $VIDEO_DEVICE"
  echo "   Please check your camera connection"
  exit 1
fi

echo ""
echo "=================================================="
echo "  Next Steps:"
echo "=================================================="
echo ""
echo "1. Create server/.env file with these settings:"
echo ""
echo "   CAMERA_TYPE=usb"
echo "   USB_CAMERA_DEVICE=/dev/video0"
echo "   CAMERA_RESOLUTION=1280x720"
echo ""
echo "2. Start the camera server:"
echo "   cd server"
echo "   npm install"
echo "   npm start"
echo ""
echo "3. The server will show you the IP address to use"
echo "   in your .env.local file"
echo ""
echo "=================================================="
