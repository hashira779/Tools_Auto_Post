import traceback
try:
    from transformers import VitsModel, AutoTokenizer
    import torch
    from scipy.io.wavfile import write
    import numpy as np

    print("Loading model...")
    repo_id = "khmerttsopensource/khmer-tts"
    tokenizer = AutoTokenizer.from_pretrained(repo_id)
    model = VitsModel.from_pretrained(repo_id)
    print("Model loaded successfully!")
    
    text = "សួស្តីអ្នកទាំងអស់គ្នា"
    inputs = tokenizer(text, return_tensors="pt")

    print(f"Tokenized input: {inputs}")

    with torch.no_grad():
        waveform = model(**inputs).waveform.squeeze().cpu().numpy()
        
    print(f"Waveform shape: {waveform.shape}, min: {np.min(waveform)}, max: {np.max(waveform)}")

    write("khmer_tts_test.wav", rate=model.config.sampling_rate, data=waveform)
    print("Successfully wrote khmer_tts_test.wav")
except Exception as e:
    print("Error during test:")
    traceback.print_exc()
