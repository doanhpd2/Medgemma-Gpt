#!/usr/bin/env python3
"""
Setup script for MedGemma 4B model
This script helps with initial model download and setup
"""

import os
import sys
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def download_medgemma_model():
    """Download MedGemma 4B model and tokenizer"""
    print("Starting MedGemma 4B model download...")
    print("This may take a while depending on your internet connection.")
    
    try:
        model_name = "google/medgemma-4b"
        
        print(f"Downloading tokenizer from {model_name}...")
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        print(f"Downloading model from {model_name}...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
            load_in_8bit=True
        )
        
        print("✅ MedGemma 4B model downloaded successfully!")
        print("The model will be cached locally for future use.")
        
        # Test the model
        print("\nTesting model with a simple prompt...")
        test_prompt = "<|im_start|>user\nHello, how are you?<|im_end|>\n<|im_start|>assistant\n"
        
        inputs = tokenizer(test_prompt, return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=50,
                do_sample=True,
                temperature=0.7,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
        print(f"Test response: {response}")
        print("✅ Model test successful!")
        
    except Exception as e:
        print(f"❌ Error downloading model: {str(e)}")
        print("\nTroubleshooting tips:")
        print("1. Make sure you have enough disk space (at least 8GB)")
        print("2. Check your internet connection")
        print("3. Make sure you have the required dependencies installed:")
        print("   pip install transformers accelerate bitsandbytes sentencepiece tokenizers")
        print("4. If you're on Windows, you might need to install Visual Studio Build Tools")
        return False
    
    return True

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        "transformers",
        "accelerate", 
        "bitsandbytes",
        "sentencepiece",
        "tokenizers",
        "torch"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\nMissing packages: {', '.join(missing_packages)}")
        print("Install them with:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def main():
    print("MedGemma 4B Setup Script")
    print("=" * 40)
    
    # Check dependencies
    print("\n1. Checking dependencies...")
    if not check_dependencies():
        print("\nPlease install missing dependencies and run this script again.")
        sys.exit(1)
    
    # Check available memory
    print("\n2. Checking system resources...")
    try:
        import psutil
        memory_gb = psutil.virtual_memory().total / (1024**3)
        print(f"Available RAM: {memory_gb:.1f} GB")
        
        if memory_gb < 8:
            print("⚠️  Warning: Less than 8GB RAM detected.")
            print("MedGemma 4B requires significant memory. Consider:")
            print("- Closing other applications")
            print("- Using a machine with more RAM")
            print("- Using CPU-only mode (slower but uses less memory)")
    except ImportError:
        print("psutil not available, skipping memory check")
    
    # Download model
    print("\n3. Downloading MedGemma 4B model...")
    if download_medgemma_model():
        print("\n🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Start your FastAPI server: uvicorn main:app --reload")
        print("2. The MedGemma 4B model will be available at /medgemma endpoint")
        print("3. You can select it from the model dropdown in your frontend")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main() 