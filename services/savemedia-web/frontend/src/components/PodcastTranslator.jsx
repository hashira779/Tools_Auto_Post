import React, { useState, useEffect } from 'react';
import { Upload, FileAudio, CheckCircle, AlertTriangle, Loader, Download, Play, Mic, Edit, List } from 'lucide-react';
import SegmentEditor from './SegmentEditor';

const PodcastTranslator = () => {
  const [file, setFile] = useState(null);
  const [importMode, setImportMode] = useState('file'); // 'file' or 'url'
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, FAILED, NEEDS_REVIEW
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [error, setError] = useState(null);
  const [segments, setSegments] = useState([]);
  const [editingSegment, setEditingSegment] = useState(null);
  const [showSegmentList, setShowSegmentList] = useState(false);

  const fetchSegments = async () => {
    if (!jobId) return;
    try {
      const response = await fetch(`/api/podcast/jobs/${jobId}/segments`);
      if (response.ok) {
        const data = await response.json();
        setSegments(data);
      }
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    }
  };

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'NEEDS_REVIEW') {
      fetchSegments();
    }
  }, [status, jobId]);

  const handleSaveSegment = async (segmentId, data) => {
    try {
      const response = await fetch(`/api/podcast/jobs/${jobId}/segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        fetchSegments();
        setEditingSegment(null);
      }
    } catch (err) {
      console.error("Failed to save segment:", err);
    }
  };

  const handleRegenerateSegment = async (segmentId, data) => {
    try {
      await fetch(`/api/podcast/jobs/${jobId}/segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const response = await fetch(`/api/podcast/jobs/${jobId}/segments/${segmentId}/regenerate`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchSegments();
        setEditingSegment(null);
      }
    } catch (err) {
      console.error("Failed to regenerate segment:", err);
    }
  };

  useEffect(() => {
    if (status === 'PROCESSING' && jobId) {
      const eventSource = new EventSource(`/api/podcast/stream/${jobId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setError(data.error);
          setStatus('FAILED');
          eventSource.close();
          return;
        }
        
        setProgress(data.progress_percent);
        setCurrentStage(data.current_stage);
        
        if (data.status === 'COMPLETED') {
          setStatus('COMPLETED');
          eventSource.close();
        } else if (data.status === 'FAILED') {
          setStatus('FAILED');
          setError(data.error_message || 'Processing failed');
          eventSource.close();
        } else if (data.status === 'NEEDS_REVIEW') {
          setStatus('NEEDS_REVIEW');
          setCurrentStage('Waiting for manual review');
          eventSource.close();
        }
      };
      
      eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [status, jobId]);

  const handleUpload = async () => {
    if (importMode === 'file' && (!file || !title)) return;
    if (importMode === 'url' && (!url || !title)) return;
    
    setStatus('UPLOADING');
    setError(null);
    
    try {
      let response;
      if (importMode === 'file') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        
        response = await fetch('/api/podcast/upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/podcast/upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, title }),
        });
      }
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setJobId(data.job_id);
      setStatus('PROCESSING');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      setStatus('FAILED');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setJobId(null);
    setStatus('IDLE');
    setProgress(0);
    setCurrentStage('');
    setError(null);
  };

  const handleResume = async () => {
    try {
      const response = await fetch(`/api/podcast/jobs/${jobId}/resume`, { method: 'POST' });
      if (response.ok) {
        setStatus('PROCESSING');
        setCurrentStage('Resuming audio synthesis...');
      }
    } catch (err) {
      console.error('Resume error:', err);
    }
  };

  return (
    <div className="card max-w-4xl w-full mx-auto p-6 sm:p-10 shadow-lg mt-8 mb-12 border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-5 mb-8 border-b border-[var(--color-border)] pb-6">
        <div className="p-3.5 bg-[var(--color-primary-500)]/10 rounded-2xl border border-[var(--color-primary-500)]/20 shadow-sm flex items-center justify-center">
          <Mic className="w-7 h-7 text-[var(--color-primary-500)]" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] tracking-tight">
            Podcast Translator
          </h2>
          <p className="text-[var(--color-text-3)] mt-1.5 text-sm sm:text-base font-medium">Convert Khmer audio to natural English seamlessly.</p>
        </div>
      </div>

      {status === 'IDLE' && (
        <div className="space-y-7 animate-fade-in">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-2)] mb-2.5">Project Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full px-4 py-3.5"
              placeholder="e.g. Interview with CEO"
            />
          </div>
          
          <div>
            <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl w-full max-w-xs mb-5">
              <button 
                onClick={() => setImportMode('file')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${importMode === 'file' ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-4)] hover:text-[var(--color-text)]'}`}
              >
                Upload File
              </button>
              <button 
                onClick={() => setImportMode('url')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${importMode === 'url' ? 'bg-[var(--color-surface)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-4)] hover:text-[var(--color-text)]'}`}
              >
                Paste Link
              </button>
            </div>

            {importMode === 'file' ? (
              <div className="relative group">
                <input 
                  type="file" 
                  accept="audio/*,video/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${file ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5' : 'border-[var(--color-border-2)] bg-[var(--color-surface-1)] group-hover:border-[var(--color-primary-300)]'}`}>
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-[var(--color-primary-500)]/10 rounded-full">
                        <FileAudio className="w-10 h-10 text-[var(--color-primary-500)]" />
                      </div>
                      <p className="text-lg font-medium text-[var(--color-text)]">{file.name}</p>
                      <p className="text-sm font-medium text-[var(--color-text-4)]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-[var(--color-surface-3)] rounded-full text-[var(--color-text-3)] group-hover:text-[var(--color-primary-500)] group-hover:bg-[var(--color-primary-500)]/10 transition-colors">
                        <Upload className="w-10 h-10" />
                      </div>
                      <p className="text-lg font-semibold text-[var(--color-text)]">Click or drag audio/video file to upload</p>
                      <p className="text-sm font-medium text-[var(--color-text-4)]">Supports MP3, WAV, M4A, MP4 (Max 500MB)</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full bg-[var(--color-surface-1)] border border-[var(--color-border-2)] rounded-2xl p-6 sm:p-8">
                <label className="block text-sm font-semibold text-[var(--color-text-2)] mb-2.5">Media Link</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-field w-full px-4 py-3.5 mb-4"
                  placeholder="Paste YouTube, TikTok, or Facebook URL here"
                />
                <div className="flex items-center gap-3 text-sm text-[var(--color-text-4)]">
                  <Upload className="w-4 h-4" />
                  <span>We'll automatically extract the audio and process it.</span>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleUpload}
            disabled={(importMode === 'file' && !file) || (importMode === 'url' && !url) || !title}
            className="btn-primary w-full py-4 text-lg mt-2 shadow-sm focus-ring"
          >
            Start Translation
          </button>
        </div>
      )}

      {status === 'UPLOADING' && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-fade-in">
          <Loader className="w-14 h-14 text-[var(--color-primary-500)] animate-spin" />
          <h3 className="text-2xl font-bold text-[var(--color-text)]">Uploading Audio...</h3>
          <p className="text-[var(--color-text-3)] font-medium">Please do not close this window.</p>
        </div>
      )}

      {status === 'PROCESSING' && (
        <div className="space-y-8 py-10 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[var(--color-text)] font-semibold">{currentStage || 'Initializing...'}</span>
            <span className="text-[var(--color-primary-500)] font-bold">{progress}%</span>
          </div>
          
          <div className="w-full h-3 bg-[var(--color-surface-3)] rounded-full overflow-hidden border border-[var(--color-border)] relative">
            <div 
              className="h-full bg-[var(--color-primary-500)] relative z-10 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 pt-8 border-t border-[var(--color-border-2)] mt-8">
            {['Transcription', 'Translation', 'Voice Gen', 'Mixing'].map((step, idx) => {
              const stepProgress = Math.max(0, Math.min(100, (progress - (idx * 25)) * 4));
              const isActive = progress > idx * 25;
              const isCompleted = progress >= (idx + 1) * 25;
              return (
                <div key={step} className="flex flex-col items-center text-center gap-2.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isCompleted ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)] text-white' : 
                      isActive ? 'bg-[var(--color-surface-1)] border-[var(--color-primary-500)] animate-pulse text-[var(--color-text)]' : 'bg-[var(--color-surface-2)] border-[var(--color-border-3)] text-[var(--color-text-4)]'}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-4)]'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="flex flex-col items-center py-10 space-y-8 animate-fade-in">
          <div className="p-5 bg-[var(--color-success)]/10 rounded-full border border-[var(--color-success)]/20 shadow-sm">
            <CheckCircle className="w-20 h-20 text-[var(--color-success)]" />
          </div>
          
          <div className="text-center">
            <h3 className="text-3xl font-bold text-[var(--color-text)] mb-2">Translation Complete!</h3>
            <p className="text-[var(--color-text-3)] font-medium">Your natural English podcast is ready.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6 max-w-2xl">
            <a 
              href={`/api/podcast/download/${jobId}/wav`}
              className="btn-primary py-3.5 flex items-center justify-center gap-2 text-[15px]"
            >
              <Download className="w-5 h-5" />
              Download Audio
            </a>
            <button 
              onClick={() => setShowSegmentList(!showSegmentList)}
              className="btn-secondary py-3.5 flex items-center justify-center gap-2 text-[15px]"
            >
              <List className="w-5 h-5" />
              {showSegmentList ? 'Hide Segments' : 'Open Segment Editor'}
            </button>
          </div>

          {showSegmentList && (
            <div className="w-full mt-10 p-6 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border)] shadow-sm animate-fade-in">
              <h4 className="text-lg font-bold text-[var(--color-text)] mb-5 flex items-center gap-2 border-b border-[var(--color-border-2)] pb-4">
                <Edit className="w-5 h-5 text-[var(--color-primary-500)]" />
                Podcast Segments
              </h4>
              
              {editingSegment ? (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-2)] p-5 rounded-xl shadow-sm">
                  <SegmentEditor 
                    segment={editingSegment}
                    onSave={handleSaveSegment}
                    onRegenerate={handleRegenerateSegment}
                    onCancel={() => setEditingSegment(null)}
                  />
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {segments.map((seg) => (
                    <div 
                      key={seg.id}
                      className={`p-5 rounded-xl border transition-colors ${seg.needs_review ? 'bg-[var(--color-warning)]/5 border-[var(--color-warning)]/30' : 'bg-[var(--color-surface)] border-[var(--color-border-2)] hover:border-[var(--color-border-3)]'}`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="badge badge-primary">
                          {seg.start_time.toFixed(1)}s - {seg.end_time.toFixed(1)}s
                        </span>
                        {seg.needs_review && (
                          <span className="badge badge-warning text-[10px] uppercase font-bold text-[var(--color-warning)]">
                            Needs Review
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-2)] line-clamp-2 mb-4 leading-relaxed font-medium">
                        {seg.english_natural || seg.english_raw}
                      </p>
                      <button 
                        onClick={() => setEditingSegment(seg)}
                        className="text-xs font-bold text-[var(--color-primary-600)] hover:text-[var(--color-primary-500)] transition-colors flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Segment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={resetForm}
            className="text-[var(--color-text-3)] hover:text-[var(--color-text)] font-semibold text-sm underline-offset-4 hover:underline transition-all mt-8"
          >
            Translate Another Podcast
          </button>
        </div>
      )}

      {(status === 'FAILED' || status === 'NEEDS_REVIEW') && (
        <div className="flex flex-col items-center py-10 space-y-6 w-full animate-fade-in">
          <div className={`p-5 rounded-full border shadow-sm ${status === 'NEEDS_REVIEW' ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20' : 'bg-[var(--color-error)]/10 border-[var(--color-error)]/20'}`}>
            <AlertTriangle className={`w-16 h-16 ${status === 'NEEDS_REVIEW' ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'}`} />
          </div>
          <div className="text-center w-full max-w-xl">
            <h3 className="text-2xl font-bold text-[var(--color-text)] mb-3">
              {status === 'NEEDS_REVIEW' ? 'Review Required' : 'Translation Failed'}
            </h3>
            <div className={`text-sm font-medium p-4 rounded-xl border ${status === 'NEEDS_REVIEW' ? 'text-[var(--color-warning)] bg-[var(--color-warning)]/5 border-[var(--color-warning)]/20' : 'text-[var(--color-error)] bg-[var(--color-error)]/5 border-[var(--color-error)]/20'}`}>
              {error || currentStage}
            </div>
          </div>

          {status === 'NEEDS_REVIEW' && segments.length > 0 && (
            <div className="w-full mt-6 space-y-4 p-6 bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border)] shadow-sm">
              <h4 className="text-lg font-bold text-[var(--color-text)] mb-4 flex items-center gap-2 border-b border-[var(--color-border-2)] pb-4">
                <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
                Segments Requiring Review
              </h4>
              {editingSegment ? (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border-2)] p-5 rounded-xl">
                  <SegmentEditor 
                    segment={editingSegment}
                    onSave={handleSaveSegment}
                    onRegenerate={handleRegenerateSegment}
                    onCancel={() => setEditingSegment(null)}
                  />
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {segments.filter(s => s.needs_review).map((seg) => (
                    <div key={seg.id} className="p-5 bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <span className="badge badge-warning text-xs font-mono text-[var(--color-warning)] bg-transparent border-[var(--color-warning)]/30">
                          #{seg.index + 1} | {seg.start_time.toFixed(1)}s
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-2)] font-medium mb-4">{seg.english_natural || seg.english_raw}</p>
                      <button 
                        onClick={() => setEditingSegment(seg)}
                        className="text-xs font-bold text-[var(--color-warning)] hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Fix Segment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {status === 'NEEDS_REVIEW' && (
              <button 
                onClick={handleResume}
                className="btn-primary bg-[var(--color-success)] hover:bg-[#10b981] px-8 py-3.5 text-[15px]"
              >
                Approve & Continue
              </button>
            )}
            <button 
              onClick={resetForm}
              className="btn-secondary px-8 py-3.5 text-[15px]"
            >
              {status === 'NEEDS_REVIEW' ? 'Cancel Project' : 'Try Again'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastTranslator;
