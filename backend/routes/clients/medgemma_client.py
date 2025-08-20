import os
import json
import asyncio
import base64
import copy
from typing import Optional, Dict, Any, List
from fastapi import Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from ..auth import User, get_current_user
from ..common import (
    ChatRequest, router,
    DEFAULT_PROMPT, DAN_PROMPT,
    check_user_permissions,
    get_conversation, save_conversation,
    normalize_assistant_content,
    ApiSettings
)
from logging_util import logger
from dotenv import load_dotenv
load_dotenv()

# Global variables for model and tokenizer
model = None
tokenizer = None
model_loaded = False

def load_medgemma_model():
    """Load MedGemma 4B model and tokenizer"""
    global model, tokenizer, model_loaded
    
    if model_loaded:
        return
    
    try:
        logger.info("Loading MedGemma 4B model...")
        
        # MedGemma 4B model from Hugging Face
        model_name = "google/medgemma-4b"
        
        # Get Hugging Face access token from environment
        hf_token = os.getenv('HUGGINGFACE_TOKEN')
        if not hf_token:
            logger.error("HUGGINGFACE_TOKEN environment variable not set")
            raise HTTPException(
                status_code=500, 
                detail="Hugging Face access token not configured. Please set HUGGINGFACE_TOKEN environment variable."
            )
        
        # Load tokenizer with access token
        tokenizer = AutoTokenizer.from_pretrained(
            model_name, 
            trust_remote_code=True,
            token=hf_token
        )
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model with quantization for memory efficiency
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
            load_in_8bit=True,  # Use 8-bit quantization to reduce memory usage
            token=hf_token
        )
        
        model_loaded = True
        logger.info("MedGemma 4B model loaded successfully")
        
    except Exception as e:
        logger.error(f"Error loading MedGemma model: {str(e)}")
        if "401" in str(e) or "unauthorized" in str(e).lower():
            raise HTTPException(
                status_code=401, 
                detail="Invalid Hugging Face access token. Please check your HUGGINGFACE_TOKEN environment variable."
            )
        elif "404" in str(e) or "not found" in str(e).lower():
            raise HTTPException(
                status_code=404, 
                detail="MedGemma model not found. Please check if you have access to this model on Hugging Face."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Failed to load MedGemma model: {str(e)}")

def normalize_user_content(part):
    """Normalize user content for MedGemma input"""
    if part.get("type") == "url":
        return {
            "type": "text",
            "text": part.get("content")
        }
    elif part.get("type") == "file":
        file_path = part.get("content")
        try:
            abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", file_path.lstrip("/")))
            with open(abs_path, "r", encoding="utf-8") as f:
                file_content = f.read()
            return {
                "type": "text",
                "text": file_content
            }
        except Exception as ex:
            logger.error(f"FILE_PROCESS_ERROR: {str(ex)}")
            return None
    elif part.get("type") == "image":
        # MedGemma supports images, but for now we'll convert to text description
        file_path = part.get("content")
        try:
            abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", file_path.lstrip("/")))
            return {
                "type": "text",
                "text": f"[Image file: {os.path.basename(file_path)}]"
            }
        except Exception as ex:
            logger.error(f"IMAGE_PROCESS_ERROR: {str(ex)}")
            return None
    return part

def format_message(message):
    """Format message for MedGemma input"""
    role = message.get("role")
    content = message.get("content")
    
    if role == "user":
        return {"role": "user", "content": [item for item in [normalize_user_content(part) for part in content] if item is not None]}
    elif role == "assistant":
        return {"role": "assistant", "content": normalize_assistant_content(content)}
    return message

def create_prompt(messages, system_message=None):
    """Create prompt for MedGemma model"""
    prompt = ""
    
    # Add system message if provided
    if system_message:
        prompt += f"<|im_start|>system\n{system_message}<|im_end|>\n"
    
    # Add conversation messages
    for message in messages:
        role = message.get("role")
        content = message.get("content")
        
        if role == "user":
            # Extract text content from user message
            if isinstance(content, list):
                text_parts = []
                for part in content:
                    if part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                user_text = " ".join(text_parts)
            else:
                user_text = str(content)
            prompt += f"<|im_start|>user\n{user_text}<|im_end|>\n"
        elif role == "assistant":
            prompt += f"<|im_start|>assistant\n{content}<|im_end|>\n"
    
    # Add assistant start token
    prompt += "<|im_start|>assistant\n"
    
    return prompt

async def process_stream(chunk_queue: asyncio.Queue, request, parameters, fastapi_request: Request):
    """Process streaming response from MedGemma"""
    try:
        # Load model if not already loaded
        if not model_loaded:
            load_medgemma_model()
        
        # Create prompt
        messages = parameters.get("messages", [])
        system_message = parameters.get("system_message", DEFAULT_PROMPT)
        prompt = create_prompt(messages, system_message)
        
        # Tokenize input
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
        
        # Generate response with streaming
        generated_tokens = 0
        max_new_tokens = parameters.get("max_new_tokens", 512)
        
        with torch.no_grad():
            for i in range(max_new_tokens):
                if await fastapi_request.is_disconnected():
                    return
                
                # Generate next token
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=1,
                    do_sample=True,
                    temperature=parameters.get("temperature", 0.7),
                    pad_token_id=tokenizer.eos_token_id,
                    use_cache=True
                )
                
                # Get the new token
                new_token = outputs[0][-1].unsqueeze(0)
                
                # Decode the token
                new_text = tokenizer.decode(new_token, skip_special_tokens=True)
                
                # Check for end of response
                if new_text.strip() == "" or "<|im_end|>" in new_text:
                    break
                
                # Send the token
                await chunk_queue.put(new_text)
                generated_tokens += 1
                
                # Update inputs for next iteration
                inputs = {"input_ids": torch.cat([inputs["input_ids"], new_token], dim=1)}
        
        # Send token usage
        await chunk_queue.put({
            "type": "token_usage",
            "input_tokens": len(tokenizer.encode(prompt)),
            "output_tokens": generated_tokens
        })
        
    except Exception as e:
        logger.error(f"Error in MedGemma streaming: {str(e)}")
        await chunk_queue.put(f"Error: {str(e)}")

@router.post("/medgemma")
async def chat_with_medgemma(
    request: ChatRequest,
    fastapi_request: Request,
    user: User = Depends(get_current_user)
):
    """Chat endpoint for MedGemma 4B model"""
    
    # Check user permissions
    error_message, in_billing, out_billing = check_user_permissions(user, request)
    if error_message:
        raise HTTPException(status_code=400, detail=error_message)
    
    # Get conversation history
    conversation = get_conversation(user, request.conversation_id)
    
    # Prepare messages
    messages = []
    
    # Add conversation history
    for msg in conversation:
        messages.append(format_message(msg))
    
    # Add current user message
    messages.append(format_message({"role": "user", "content": request.user_message}))
    
    # Prepare parameters
    parameters = {
        "messages": messages,
        "system_message": request.system_message or DEFAULT_PROMPT,
        "temperature": request.temperature,
        "max_new_tokens": 512,
        "stream": request.stream
    }
    
    if request.stream:
        # Streaming response
        async def generate_stream():
            chunk_queue = asyncio.Queue()
            
            # Start processing in background
            asyncio.create_task(process_stream(chunk_queue, request, parameters, fastapi_request))
            
            response_text = ""
            
            while True:
                try:
                    chunk = await asyncio.wait_for(chunk_queue.get(), timeout=30.0)
                    
                    if isinstance(chunk, dict) and chunk.get("type") == "token_usage":
                        # Save conversation with token usage
                        save_conversation(
                            user, request.user_message, response_text,
                            chunk, request, in_billing, out_billing
                        )
                        break
                    else:
                        response_text += str(chunk)
                        yield f"data: {json.dumps({'content': str(chunk)})}\n\n"
                        
                except asyncio.TimeoutError:
                    break
                except Exception as e:
                    logger.error(f"Stream error: {str(e)}")
                    break
            
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    else:
        # Non-streaming response
        try:
            # Load model if not already loaded
            if not model_loaded:
                load_medgemma_model()
            
            # Create prompt
            prompt = create_prompt(messages, parameters["system_message"])
            
            # Tokenize input
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
            
            # Generate response
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=parameters["max_new_tokens"],
                    do_sample=True,
                    temperature=parameters["temperature"],
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Decode response
            response_text = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
            
            # Calculate token usage
            input_tokens = len(tokenizer.encode(prompt))
            output_tokens = len(tokenizer.encode(response_text))
            token_usage = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens
            }
            
            # Save conversation
            save_conversation(user, request.user_message, response_text, token_usage, request, in_billing, out_billing)
            
            return {
                "content": response_text,
                "token_usage": token_usage
            }
            
        except Exception as e:
            logger.error(f"Error in MedGemma chat: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}") 