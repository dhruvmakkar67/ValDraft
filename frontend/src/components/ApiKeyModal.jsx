import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Check, X, ExternalLink } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    try {
      const res = await fetch('/api/set_gemini_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setStatusMsg('Gemini API Key activated for live comp ratings!');
        setTimeout(() => {
          onClose();
          setSaved(false);
          setStatusMsg('');
        }, 1500);
      }
    } catch (err) {
      setStatusMsg('Failed to update API key.');
    }
  };

  return (
    <div className="modal-backdrop">
      <motion.div 
        className="api-modal glass-panel"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="modal-header">
          <div className="header-left">
            <Key size={20} className="key-icon" />
            <h3 className="modal-title font-display">GEMINI AI INTEGRATION</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-desc">
          ValDraft features a built-in VCT tactical evaluator that works completely offline. 
          Optionally provide your Google Gemini API key to unlock dynamic live LLM esports commentary!
        </p>

        <form onSubmit={handleSave} className="modal-form">
          <label className="form-label font-display">GOOGLE GEMINI API KEY</label>
          <input 
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input font-display"
          />

          <div className="modal-helper">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="aistudio-link"
            >
              <span>Get a free key from Google AI Studio</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {statusMsg && (
            <div className={`status-alert ${saved ? 'success' : 'error'} font-display`}>
              {saved && <Check size={16} />}
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-val btn-secondary" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="btn-val btn-cyan" disabled={!apiKey.trim()}>
              SAVE & ACTIVATE
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
