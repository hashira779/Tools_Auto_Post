import logging

logger = logging.getLogger("voxcpm2-local.gpu")

def get_gpu_info() -> dict:
    """Detects available GPU and capabilities safely without throwing ModuleNotFoundError."""
    info = {
        "available": False,
        "name": "None",
        "vram_gb": 0.0,
        "cuda_version": "None"
    }
    
    try:
        import torch
        if torch.cuda.is_available():
            info["available"] = True
            info["name"] = torch.cuda.get_device_name(0)
            vram_bytes = torch.cuda.get_device_properties(0).total_memory
            info["vram_gb"] = round(vram_bytes / (1024 ** 3), 2)
            info["cuda_version"] = torch.version.cuda
            logger.info(f"Detected GPU via PyTorch: {info['name']} ({info['vram_gb']} GB VRAM)")
            return info
    except Exception as e:
        logger.debug(f"PyTorch CUDA check skipped: {e}")

    # Fallback to nvidia-smi CLI
    try:
        import subprocess
        res = subprocess.run(
            ["nvidia-smi", "--query-gpu=gpu_name,memory.total", "--format=csv,noheader,nounits"],
            capture_output=True,
            text=True,
            timeout=2
        )
        if res.returncode == 0 and res.stdout.strip():
            parts = res.stdout.strip().split(',')
            info["available"] = True
            info["name"] = parts[0].strip()
            if len(parts) > 1:
                info["vram_gb"] = round(float(parts[1].strip()) / 1024.0, 2)
            info["cuda_version"] = "NVIDIA Driver"
            logger.info(f"Detected GPU via nvidia-smi: {info['name']}")
    except Exception:
        pass
        
    return info

def is_gpu_sufficient(vram_required_gb=4.0) -> bool:
    """Checks if the GPU has enough VRAM for the model."""
    info = get_gpu_info()
    return info["available"] and info["vram_gb"] >= vram_required_gb
