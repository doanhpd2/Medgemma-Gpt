#!/usr/bin/env python3
import os
import logging
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText
import io
# ----------------------
# Logging
# ----------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------------
# Flask setup
# ----------------------
app = Flask(__name__)
CORS(app)

# ----------------------
# Global model variables
# ----------------------
model = None
processor = None
device = None

# ----------------------
# Load model
# ----------------------
def load_model():
    global model, processor, device
    try:
        logger.info("Loading MedGemma-4b-it model...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")

        model_id = "google/medgemma-4b-it"

        processor = AutoProcessor.from_pretrained(model_id)
        model = AutoModelForImageTextToText.from_pretrained(
            model_id,
            torch_dtype=torch.bfloat16 if device=="cuda" else torch.float32,
            device_map="auto" if device=="cuda" else None,
            trust_remote_code=True
        )

        if device == "cpu":
            model = model.to(device)

        logger.info("Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

# ----------------------
# Health endpoint
# ----------------------
@app.route('/health', methods=['GET'])
def health_check():
    if model is not None and processor is not None:
        return jsonify({"status": "healthy", "model_loaded": True, "device": device}), 200
    else:
        return jsonify({"status": "unhealthy", "model_loaded": False}), 503

# ----------------------
# Generate endpoint (text + optional image)
# ----------------------
@app.route('/generate', methods=['POST'])
def generate_text():
    try:
        pil_images = []

        # --- Nếu gửi FormData ---
        if request.content_type.startswith("multipart/form-data"):
            prompt = request.form.get("prompt", "").strip()
            files = request.files.getlist("image")
            for f in files:
                pil_images.append(Image.open(io.BytesIO(f.read())).convert("RGB"))

        # --- Nếu gửi JSON { prompt, image_paths } ---
        else:
            data = request.get_json()
            prompt = data.get("prompt", "").strip()
            image_paths = data.get("image_paths", [])

            for path in image_paths:
                try:
                    pil_images.append(Image.open(path).convert("RGB"))
                except Exception as e:
                    logger.warning(f"Không mở được ảnh {path}: {e}")

        if not prompt:
            return jsonify({"error": "Prompt is empty"}), 400

        # --- Build messages và generate ---
        messages = [
            {"role": "system", "content": [{"type": "text", "text": "Bạn là một chuyên gia hỗ trợ y tế cho bác sĩ."}]},
            {"role": "user", "content": [{"type": "text", "text": prompt}] + [{"type": "image", "image": img} for img in pil_images]}
        ]

        inputs = processor.apply_chat_template(
            messages, add_generation_prompt=True, tokenize=True,
            return_dict=True, return_tensors="pt"
        ).to(model.device, dtype=torch.bfloat16 if device=="cuda" else torch.float32)

        input_len = inputs["input_ids"].shape[-1]

        with torch.inference_mode():
            outputs = model.generate(**inputs, max_new_tokens=1024, do_sample=False)
            outputs = outputs[0][input_len:]

        decoded = processor.decode(outputs, skip_special_tokens=True)
        return jsonify({"response": decoded, "generated_text": decoded, "input_prompt": prompt}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ----------------------
# Model info endpoint
# ----------------------
@app.route('/model_info', methods=['GET'])
def model_info():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 503
    return jsonify({
        "model_name": "google/medgemma-4b-it",
        "device": device,
        "parameters": sum(p.numel() for p in model.parameters()),
        "trainable_parameters": sum(p.numel() for p in model.parameters() if p.requires_grad)
    }), 200

# ----------------------
# Start server
# ----------------------
if __name__ == "__main__":
    if load_model():
        logger.info("Starting MedGemma server on http://0.0.0.0:8001")
        app.run(host='0.0.0.0', port=8001, debug=False)
    else:
        logger.error("Failed to load model. Exiting.")
        exit(1)
