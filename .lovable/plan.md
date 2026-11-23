# Run AgriVision with the Roboflow-trained model

## Goal
Replace Gemini-based predictions with predictions from the user's actual trained Roboflow model, running on the Raspberry Pi so the phone app does not send plant images to Gemini.

## Work
1. Locate the Roboflow training project and confirm a completed model version, its exact class labels, and an available local inference/export method. Do not invent a model, labels, or evaluation results.
2. Set up a Pi-side inference service using the compatible Roboflow runtime and model. Keep model credentials out of browser code and make it reachable by the phone on the same network.
3. Update the app to send both uploaded and Pi-captured images to that Pi service, remove the Gemini function call, and show only predictions and confidence actually returned by the model.
4. Verify the flow with a real image and confirm the app no longer calls Gemini.

## Technical details
The project currently contains no model weights and its detection function calls Gemini. Choose the runtime only after seeing the actual Roboflow model/version and confirming Raspberry Pi compatibility. Local inference may require internet to download model weights once; image predictions then run on the Pi. Do not replace the current detector until the user's real model is identified.

## Waiting on
The user needs help finding the Roboflow project/model version or exported model file before model-specific integration can be completed.
