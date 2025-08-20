#!/usr/bin/env python3
"""
Hugging Face Token Setup Script
This script helps users set up their Hugging Face access token for MedGemma 4B
"""

import os
import sys
import webbrowser
from pathlib import Path

def check_token_exists():
    """Check if HUGGINGFACE_TOKEN is already set"""
    token = os.getenv('HUGGINGFACE_TOKEN')
    if token:
        print(f"✅ HUGGINGFACE_TOKEN is already set: {token[:8]}...")
        return True
    else:
        print("❌ HUGGINGFACE_TOKEN is not set")
        return False

def open_hf_links():
    """Open relevant Hugging Face links in browser"""
    print("\n🔗 Opening Hugging Face links...")
    
    links = {
        "Join Hugging Face": "https://huggingface.co/join",
        "Token Settings": "https://huggingface.co/settings/tokens",
        "MedGemma 4B Model": "https://huggingface.co/google/medgemma-4b"
    }
    
    for name, url in links.items():
        print(f"Opening {name}...")
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"Could not open {name}: {e}")
    
    print("\n📋 Please complete these steps:")
    print("1. Create a Hugging Face account (if you don't have one)")
    print("2. Go to your token settings and create a new token with 'read' permissions")
    print("3. Accept the MedGemma 4B model terms")
    print("4. Copy your token and set it as an environment variable")

def set_token_windows():
    """Set token on Windows"""
    print("\n🪟 Windows Setup:")
    print("PowerShell (current session):")
    print("  $env:HUGGINGFACE_TOKEN=\"your_token_here\"")
    print("\nCMD (current session):")
    print("  set HUGGINGFACE_TOKEN=your_token_here")
    print("\nPersist for your user (PowerShell):")
    print("  [Environment]::SetEnvironmentVariable(\"HUGGINGFACE_TOKEN\",\"your_token_here\",\"User\")")
    print("\nOr add to your .env file:")
    print("  HUGGINGFACE_TOKEN=your_token_here")

def set_token_unix():
    """Set token on Unix-like systems"""
    print("\n🐧 Linux/Mac Setup:")
    print("Run this command in your terminal:")
    print("export HUGGINGFACE_TOKEN=your_token_here")
    print("\nOr add to your .env file:")
    print("HUGGINGFACE_TOKEN=your_token_here")

def create_env_file():
    """Create or update .env file"""
    env_file = Path(".env")
    
    if env_file.exists():
        print(f"\n📄 .env file already exists at {env_file.absolute()}")
        with open(env_file, 'r') as f:
            content = f.read()
            if 'HUGGINGFACE_TOKEN' in content:
                print("✅ HUGGINGFACE_TOKEN is already in .env file")
                return
            else:
                print("📝 Adding HUGGINGFACE_TOKEN to existing .env file...")
    else:
        print(f"\n📄 Creating new .env file at {env_file.absolute()}...")
    
    token = input("Enter your Hugging Face access token: ").strip()
    if not token:
        print("❌ No token provided. Please run this script again with a valid token.")
        return
    
    # Add to .env file
    with open(env_file, 'a') as f:
        f.write(f"\nHUGGINGFACE_TOKEN={token}\n")
    
    print("✅ Token added to .env file!")
    print("⚠️  Remember to restart your terminal/IDE for the changes to take effect.")

def test_token():
    """Test if the token works"""
    token = os.getenv('HUGGINGFACE_TOKEN')
    if not token:
        print("❌ No token found. Please set HUGGINGFACE_TOKEN first.")
        return False
    
    print("\n🧪 Testing token...")
    try:
        import requests
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get("https://huggingface.co/api/models/google/medgemma-4b", headers=headers)
        
        if response.status_code == 200:
            print("✅ Token is valid and can access MedGemma 4B!")
            return True
        elif response.status_code == 401:
            print("❌ Invalid token. Please check your token.")
            return False
        elif response.status_code == 404:
            print("❌ Model not found or access denied. Please accept the model terms:")
            print("https://huggingface.co/google/medgemma-4b")
            return False
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return False
            
    except ImportError:
        print("⚠️  requests library not available. Skipping token test.")
        return True
    except Exception as e:
        print(f"❌ Error testing token: {e}")
        return False

def main():
    print("🔑 Hugging Face Token Setup for MedGemma 4B")
    print("=" * 50)
    
    # Check if token already exists
    if check_token_exists():
        if test_token():
            print("\n🎉 Your Hugging Face token is ready!")
            print("You can now run: python setup_medgemma.py")
            return
        else:
            print("\n⚠️  Token exists but is invalid. Please update it.")
    
    # Show setup instructions
    print("\n📖 Setup Instructions:")
    open_hf_links()
    
    # Platform-specific instructions
    if sys.platform.startswith('win'):
        set_token_windows()
    else:
        set_token_unix()
    
    # Offer to create .env file
    print("\n" + "=" * 50)
    choice = input("\nWould you like to create/update a .env file? (y/n): ").lower().strip()
    if choice in ['y', 'yes']:
        create_env_file()
    
    print("\n📝 Next steps:")
    print("1. Set your HUGGINGFACE_TOKEN environment variable")
    print("2. Restart your terminal/IDE")
    print("3. Run: python setup_medgemma.py")
    print("4. Start your server: uvicorn main:app --reload")

if __name__ == "__main__":
    main() 