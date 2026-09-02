import React, { useState } from 'react';
import { Play, RotateCcw, Save, X, Edit3, Sliders, Check } from 'lucide-react';

const SegmentEditor = ({ segment, onSave, onRegenerate, onCancel }) => {
  const [editedEnglish, setEditedEnglish] = useState(segment.english_natural || segment.english_raw || '');
  const [speed, setSpeed] = useState(segment.time_stretch_ratio || 1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(segment.id, {
      english_natural: editedEnglish,
      time_stretch_ratio: speed,
      pitch: pitch
    });
    setIsSaving(false);
  };

  const handleRegenerate = async () => {
    setIsSaving(true);
    await onRegenerate(segment.id, {
      english_natural: editedEnglish,
      time_stretch_ratio: speed
    });
    setIsSaving(false);
  };

  return (
    <div className="bg-[var(--color-surface-2)] rounded-2xl border border-white/10 overflow-hidden animate-fade-in shadow-xl">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h4 className="text-white font-bold flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-purple-400" />
          Edit Segment #{segment.index + 1}
        </h4>
        <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Khmer Source */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 ">Original Khmer</label>
          <div className="p-4 bg-black/20 rounded-xl border border-white/5 text-gray-300 leading-relaxed">
            {segment.khmer_text}
          </div>
        </div>

        {/* English Edit */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 ">Natural English</label>
          <textarea
            value={editedEnglish}
            onChange={(e) => setEditedEnglish(e.target.value)}
            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none leading-relaxed"
            placeholder="Enter natural English translation..."
          />
        </div>

        {/* Audio Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sliders className="w-3 h-3" /> Speed
              </label>
              <span className="text-purple-400 font-mono text-sm">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Sliders className="w-3 h-3" /> Pitch
              </label>
              <span className="text-blue-400 font-mono text-sm">{pitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>Lower</span>
              <span>Normal</span>
              <span>Higher</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          
          <button
            onClick={handleRegenerate}
            disabled={isSaving}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors border border-white/10 disabled:opacity-50"
          >
            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Regenerate Voice
          </button>

          <button
            onClick={() => {/* Implement play logic */}}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-xl font-bold transition-colors border border-indigo-500/20"
          >
            <Play className="w-4 h-4" />
            Play
          </button>
        </div>
      </div>
    </div>
  );
};

const Loader = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default SegmentEditor;
