#!/usr/bin/env python3
import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

# ----------------------
# Logging
# ----------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------------
# Flask setup
# ----------------------
app = Flask(__name__)
CORS(app)  # cho phép frontend cross-origin

# ----------------------
# Global model variables
# ----------------------
model = None
tokenizer = None
device = None

# ----------------------
# Load model
# ----------------------
def load_model():
    global model, tokenizer, device
    try:
        logger.info("Loading MedGemma model...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")

        model_name = "google/medgemma-4b-it"

        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
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
    if model is not None and tokenizer is not None:
        return jsonify({"status": "healthy", "model_loaded": True, "device": device}), 200
    else:
        return jsonify({"status": "unhealthy", "model_loaded": False}), 503

# ----------------------
# Generate endpoint
# ----------------------
@app.route('/generate', methods=['POST'])
def generate_text():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        if not prompt:
            return jsonify({"error": "Prompt is empty"}), 400

        max_new_tokens = data.get('max_new_tokens', 512)
        do_sample = data.get('do_sample', True)
        temperature = min(max(data.get('temperature', 0.7), 0.1), 0.9)
        top_p = min(max(data.get('top_p', 0.1), 0.1), 0.95)

        # --- Tokenize input ---
        inputs = tokenizer(prompt, return_tensors="pt")

        # Chia dtype đúng:
        # input_ids luôn long
        # các tensor khác có thể bfloat16 trên GPU
        inputs = {k: (v.to(device=device, dtype=torch.long) if k=="input_ids"
                      else v.to(device=device, dtype=torch.bfloat16 if device=="cuda" else torch.float32))
                  for k, v in inputs.items()}

        generate_kwargs = {
            **inputs,
            "max_new_tokens": max_new_tokens,
            "do_sample": do_sample,
            "temperature": temperature,
            "top_p": top_p,
            "pad_token_id": tokenizer.eos_token_id,
        }

        # --- Generate text safely ---
        with torch.inference_mode():
            try:
                outputs = model.generate(**generate_kwargs)
            except RuntimeError as e:
                logger.error(f"GPU error: {e}, retrying on CPU...")
                model.to("cpu")
                inputs = {k: (v.to("cpu", dtype=torch.long) if k=="input_ids"
                              else v.to("cpu", dtype=torch.float32))
                          for k, v in inputs.items()}
                outputs = model.generate(**generate_kwargs)

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response_text = generated_text[len(prompt):].strip()

        return jsonify({
            "response": response_text,
            "generated_text": generated_text,
            "input_prompt": prompt
        }), 200

    except Exception as e:
        logger.error(f"Error generating text: {e}")
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
