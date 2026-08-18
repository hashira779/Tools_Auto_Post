import React, { useState, useEffect } from 'react';
import { Upload, FileAudio, CheckCircle, AlertTriangle, Loader, Download, Play, Mic, Edit, List } from 'lucide-react';
import SegmentEditor from './SegmentEditor';

const PodcastTranslator = () => {
  const [file, setFile] = useState(null);
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
      // First save then regenerate
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
        // Don't immediately close on error, it might reconnect
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [status, jobId]);

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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl mt-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
          <Mic className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Podcast Translator
          </h2>
          <p className="text-gray-400 mt-1">Convert Khmer audio to natural English seamlessly.</p>
        </div>
      </div>

      {status === 'IDLE' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="e.g. Interview with CEO"
            />
          </div>
          
          <div className="relative group">
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`w-full border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${file ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 bg-black/20 group-hover:border-white/40 group-hover:bg-black/30'}`}>
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <FileAudio className="w-10 h-10 text-purple-400" />
                  </div>
                  <p className="text-lg font-medium text-white">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-full">
                    <Upload className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-white">Click or drag audio file to upload</p>
                  <p className="text-sm text-gray-400">Supports MP3, WAV, M4A, FLAC (Max 500MB)</p>
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={handleUpload}
            disabled={!file || !title}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Start Translation
          </button>
        </div>
      )}

      {status === 'UPLOADING' && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <Loader className="w-16 h-16 text-purple-500 animate-spin" />
          <h3 className="text-2xl font-bold text-white">Uploading Audio...</h3>
          <p className="text-gray-400">Please do not close this window.</p>
        </div>
      )}

      {status === 'PROCESSING' && (
        <div className="space-y-8 py-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{currentStage || 'Initializing...'}</span>
            <span className="text-purple-400 font-bold">{progress}%</span>
          </div>
          
          <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-full"></div>
            {/* Actual progress bar */}
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative z-10 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Shine effect */}
              <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 pt-8">
            {['Transcription', 'Translation', 'Voice Gen', 'Mixing'].map((step, idx) => {
              const stepProgress = Math.max(0, Math.min(100, (progress - (idx * 25)) * 4));
              return (
                <div key={step} className="flex flex-col items-center text-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${progress >= (idx + 1) * 25 ? 'bg-purple-500 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 
                      progress > idx * 25 ? 'bg-black border-purple-500 animate-pulse' : 'bg-black border-white/20'}`}
                  >
                    {progress >= (idx + 1) * 25 ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-medium text-gray-400">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${progress > idx * 25 ? 'text-white' : 'text-gray-500'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="flex flex-col items-center py-10 space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full"></div>
            <CheckCircle className="w-24 h-24 text-green-400 relative z-10" />
          </div>
          
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-2">Translation Complete!</h3>
            <p className="text-gray-400">Your natural English podcast is ready.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
            <a 
              href={`/api/podcast/download/${jobId}/wav`}
              className="flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10 hover:border-purple-500/50"
            >
              <Play className="w-5 h-5" />
              Download Audio (WAV)
            </a>
            <button 
              onClick={() => setShowSegmentList(!showSegmentList)}
              className="flex items-center justify-center gap-3 py-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl font-bold transition-all border border-purple-500/20"
            >
              <List className="w-5 h-5" />
              {showSegmentList ? 'Hide Segments' : 'Open Segment Editor'}
            </button>
          </div>

          {showSegmentList && (
            <div className="w-full mt-8 space-y-4 animate-fade-in">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-400" />
                Podcast Segments
              </h4>
              
              {editingSegment ? (
                <SegmentEditor 
                  segment={editingSegment}
                  onSave={handleSaveSegment}
                  onRegenerate={handleRegenerateSegment}
                  onCancel={() => setEditingSegment(null)}
                />
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {segments.map((seg) => (
                    <div 
                      key={seg.id}
                      className={`p-4 rounded-xl border transition-all ${seg.needs_review ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-500">
                          {seg.start_time.toFixed(1)}s - {seg.end_time.toFixed(1)}s
                        </span>
                        {seg.needs_review && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded uppercase tracking-tighter border border-yellow-500/30">
                            Needs Review
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3 leading-relaxed">{seg.english_natural || seg.english_raw}</p>
                      <button 
                        onClick={() => setEditingSegment(seg)}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit Segment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={resetForm}
            className="text-purple-400 hover:text-purple-300 font-medium underline-offset-4 hover:underline transition-all mt-8"
          >
            Translate Another Podcast
          </button>
        </div>
      )}

      {(status === 'FAILED' || status === 'NEEDS_REVIEW') && (
        <div className="flex flex-col items-center py-10 space-y-6 w-full">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className={`w-16 h-16 ${status === 'NEEDS_REVIEW' ? 'text-yellow-500' : 'text-red-500'}`} />
          </div>
          <div className="text-center w-full max-w-lg">
            <h3 className="text-2xl font-bold text-white mb-2">
              {status === 'NEEDS_REVIEW' ? 'Review Required' : 'Translation Failed'}
            </h3>
            <div className={`${status === 'NEEDS_REVIEW' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'} p-4 rounded-xl border`}>
              {error || currentStage}
            </div>
          </div>

          {status === 'NEEDS_REVIEW' && segments.length > 0 && (
            <div className="w-full mt-4 space-y-4">
              <h4 className="text-lg font-bold text-white mb-2 text-center">Segments Requiring Review</h4>
              {editingSegment ? (
                <SegmentEditor 
                  segment={editingSegment}
                  onSave={handleSaveSegment}
                  onRegenerate={handleRegenerateSegment}
                  onCancel={() => setEditingSegment(null)}
                />
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {segments.filter(s => s.needs_review).map((seg) => (
                    <div key={seg.id} className="p-4 bg-yellow-500/5 border border-yellow-500/30 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-500">#{seg.index + 1} | {seg.start_time.toFixed(1)}s</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{seg.english_natural || seg.english_raw}</p>
                      <button 
                        onClick={() => setEditingSegment(seg)}
                        className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Fix Segment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {status === 'NEEDS_REVIEW' && (
              <button 
                onClick={handleResume}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all"
              >
                Approve & Continue
              </button>
            )}
            <button 
              onClick={resetForm}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10"
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
