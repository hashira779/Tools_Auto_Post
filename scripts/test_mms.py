import sys
import subprocess

def install_and_test():
    print("Installing transformers and torch (CPU)...")
    subprocess.run(["pip", "install", "transformers", "torch", "scipy", "soundfile", "--index-url", "https://download.pytorch.org/whl/cpu"], check=True)
    
    print("Loading MMS-TTS model for Khmer...")
    from transformers import VitsModel, AutoTokenizer
    import torch
    import soundfile as sf
    
    model = VitsModel.from_pretrained("facebook/mms-tts-khm")
    tokenizer = AutoTokenizer.from_pretrained("facebook/mms-tts-khm")
    
    text = "សួស្តី តើអ្នកសុខសប្បាយជាទេ?"
    inputs = tokenizer(text, return_tensors="pt")
    
    with torch.no_grad():
        output = model(**inputs).waveform
        
    audio_data = output.cpu().numpy().squeeze()
    sf.write("/tmp/test_khmer.wav", audio_data, model.config.sampling_rate)
    print("Successfully generated /tmp/test_khmer.wav!")

if __name__ == "__main__":
    install_and_test()
