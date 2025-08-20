# MedGemma 4B Integration

This backend has been refactored to include Google's MedGemma 4B model from Hugging Face. MedGemma is a medical AI model specifically designed for healthcare applications.

## Features

- **MedGemma 4B Model**: Google's medical AI model with 4 billion parameters
- **Local Inference**: Runs entirely on your local machine (no API costs)
- **Streaming Support**: Real-time streaming responses
- **Memory Efficient**: Uses 8-bit quantization to reduce memory usage
- **Medical Focus**: Optimized for healthcare and medical conversations

## System Requirements

- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: At least 8GB free space for model download
- **Python**: 3.8 or higher
- **OS**: Windows, macOS, or Linux

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

The requirements.txt file has been updated to include:
- `transformers==4.40.0` - Hugging Face transformers library
- `accelerate==0.30.0` - Model acceleration
- `bitsandbytes==0.43.0` - 8-bit quantization
- `sentencepiece==0.2.0` - Tokenization
- `tokenizers==0.19.0` - Fast tokenization

### 2. Download MedGemma Model

Run the setup script to download the model:

```bash
python setup_medgemma.py
```

This script will:
- Check your system dependencies
- Download the MedGemma 4B model (~8GB)
- Test the model with a simple prompt
- Cache the model locally for future use

### 3. Start the Server

```bash
uvicorn main:app --reload
```

## Usage

### API Endpoint

The MedGemma model is available at the `/medgemma` endpoint:

```bash
POST /medgemma
```

### Request Format

```json
{
  "conversation_id": "your_conversation_id",
  "model": "medgemma-4b",
  "in_billing": 0,
  "out_billing": 0,
  "temperature": 0.7,
  "reason": 0,
  "verbosity": 2,
  "system_message": "You are a helpful medical AI assistant.",
  "user_message": [
    {
      "type": "text",
      "text": "What are the symptoms of diabetes?"
    }
  ],
  "inference": false,
  "search": false,
  "deep_research": false,
  "dan": false,
  "mcp": [],
  "stream": true
}
```

### Model Configuration

The MedGemma model is configured in `models.json`:

```json
{
  "model_name": "medgemma-4b",
  "model_alias": "MedGemma 4B",
  "description": "Google MedGemma 4B 의료 AI 모델",
  "endpoint": "/medgemma",
  "in_billing": "0",
  "out_billing": "0",
  "capabilities": {
    "stream": true,
    "image": false,
    "inference": true,
    "search": false,
    "deep_research": false,
    "mcp": false
  },
  "controls": {
    "temperature": true,
    "reason": false,
    "verbosity": true,
    "system_message": true
  },
  "admin": false
}
```

## Model Features

### Medical Expertise
- Trained on medical literature and healthcare data
- Optimized for medical conversations
- Can provide information about symptoms, treatments, and medical conditions

### Memory Optimization
- Uses 8-bit quantization to reduce memory usage
- Automatic device mapping (CPU/GPU)
- Efficient tokenization and generation

### Streaming Responses
- Real-time token streaming
- Supports both streaming and non-streaming modes
- Automatic conversation history management

## Troubleshooting

### Memory Issues
If you encounter memory errors:

1. **Close other applications** to free up RAM
2. **Use CPU-only mode** by modifying the model loading in `medgemma_client.py`:
   ```python
   model = AutoModelForCausalLM.from_pretrained(
       model_name,
       torch_dtype=torch.float16,
       device_map="cpu",  # Force CPU usage
       trust_remote_code=True,
       load_in_8bit=True
   )
   ```

### Download Issues
If model download fails:

1. **Check internet connection**
2. **Ensure sufficient disk space** (8GB+)
3. **Try downloading manually**:
   ```python
   from transformers import AutoTokenizer, AutoModelForCausalLM
   tokenizer = AutoTokenizer.from_pretrained("google/medgemma-4b", trust_remote_code=True)
   model = AutoModelForCausalLM.from_pretrained("google/medgemma-4b", trust_remote_code=True)
   ```

### Performance Optimization
For better performance:

1. **Use GPU** if available (requires CUDA)
2. **Adjust batch size** in the client code
3. **Monitor memory usage** during inference

## Integration with Frontend

The model will appear in your frontend's model selection dropdown as "MedGemma 4B". Users can select it just like any other model.

## Security Considerations

- The model runs locally, so no data is sent to external APIs
- Medical information should be treated as sensitive data
- Consider implementing proper access controls for medical conversations
- Always remind users that this is not a substitute for professional medical advice

## Limitations

- **Medical Focus**: While good for medical topics, may not be optimal for general conversation
- **Model Size**: 4B parameters require significant computational resources
- **Training Data**: Model was trained on data up to a certain date
- **Not Medical Advice**: Should not be used as a substitute for professional medical consultation

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the model documentation on Hugging Face
3. Check system requirements and dependencies
4. Monitor server logs for detailed error messages 