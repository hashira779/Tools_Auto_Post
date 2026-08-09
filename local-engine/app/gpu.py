import torch
import platform
import logging

logger = logging.getLogger("voxcpm2-local.gpu")

def get_gpu_info() -> dict:
    """Detects available GPU and capabilities."""
    info = {
        "available": False,
        "name": "None",
        "vram_gb": 0.0,
        "cuda_version": "None"
    }
    
    try:
        if torch.cuda.is_available():
            info["available"] = True
            info["name"] = torch.cuda.get_device_name(0)
            
            # Convert bytes to GB
            vram_bytes = torch.cuda.get_device_properties(0).total_memory
            info["vram_gb"] = round(vram_bytes / (1024 ** 3), 2)
            info["cuda_version"] = torch.version.cuda
            
            logger.info(f"Detected GPU: {info['name']} ({info['vram_gb']} GB VRAM)")
        else:
            logger.warning("No CUDA GPU detected.")
            
    except Exception as e:
        logger.error(f"Error detecting GPU: {e}")
        
    return info

def is_gpu_sufficient(vram_required_gb=4.0) -> bool:
    """Checks if the GPU has enough VRAM for the model."""
    info = get_gpu_info()
    return info["available"] and info["vram_gb"] >= vram_required_gb
