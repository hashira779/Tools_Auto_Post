import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('10.1.0.11', username='ubuntu-server', password='pTT!CT01')

cmd = '''sudo -S docker exec auto-post-bot python -c "
import torch
from ctc_forced_aligner import generate_emissions, get_alignments, get_spans, load_alignment_model, load_audio, postprocess_results, preprocess_text
device = 'cpu'
alignment_model, alignment_tokenizer = load_alignment_model(device, dtype=torch.float32)
audio_waveform = torch.zeros(1, 16000)
emissions, stride = generate_emissions(alignment_model, audio_waveform, batch_size=1)
tokens_starred, text_starred = preprocess_text('hello world', romanize=True, language='eng')
segments, scores, blank_token = get_alignments(emissions, tokens_starred, alignment_tokenizer)
spans = get_spans(tokens_starred, segments, blank_token)
aligned_items = postprocess_results(text_starred, spans, stride, scores)
print(aligned_items)
"'''

stdin, stdout, stderr = ssh.exec_command(cmd)
stdin.write('pTT!CT01\n')
stdin.flush()

print('STDOUT:', stdout.read().decode())
print('STDERR:', stderr.read().decode())
