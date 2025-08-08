import requests
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
HF_API_URL = "https://api-inference.huggingface.co/models/Qwen/Qwen2-7B-Instruct"

def query_qwen2(message: str) -> str:
    """Query Qwen2 model via Hugging Face API"""
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": f"Human: {message}\n\nAssistant:",
        "parameters": {
            "max_new_tokens": 500,
            "temperature": 0.7,
            "do_sample": True,
            "top_p": 0.9,
            "return_full_text": False
        }
    }
    
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get('generated_text', '')
        elif isinstance(result, dict):
            generated_text = result.get('generated_text', result.get('choices', [{}])[0].get('text', ''))
        else:
            generated_text = str(result)
        
        # Clean up the response
        if generated_text:
            # Remove the input prompt if it's included
            if "Human:" in generated_text:
                generated_text = generated_text.split("Assistant:")[-1].strip()
            return generated_text.strip()
        else:
            return "I'm sorry, I couldn't generate a response. Please try again."
            
    except requests.exceptions.Timeout:
        return "I'm taking longer than usual to respond. Please try again."
    except requests.exceptions.RequestException as e:
        print(f"API request error: {e}")
        return "I'm experiencing technical difficulties. Please try again later."
    except Exception as e:
        print(f"Unexpected error: {e}")
        return "I encountered an unexpected error. Please try again."
