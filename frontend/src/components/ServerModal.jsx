import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Server, Check, X, ExternalLink, RefreshCw, Activity, Radio, AlertCircle } from 'lucide-react';
import { SOCKET_URL, updateSocketUrl, getStoredBackendUrl } from '../socket';

export default function ServerModal({ isOpen, onClose, isConnected }) {
  const [urlInput, setUrlInput] = useState(SOCKET_URL || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(SOCKET_URL || getStoredBackendUrl());
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl) => {
    const testTarget = (targetUrl || urlInput).replace(/\/$/, '');
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${testTarget}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Connected! Service is healthy with ${data.agents_count || 29} agents and ${data.maps_count || 10} maps.`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Server responded with HTTP status ${res.status}.`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Could not reach server. It might still be booting up on Render (free tier takes ~45s to wake).',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim().replace(/\/$/, '');
    updateSocketUrl(cleanUrl);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    const defaultUrl = 'https://valdraft-backend.onrender.com';
    setUrlInput(defaultUrl);
    updateSocketUrl(defaultUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  return (
    <div className="modal-backdrop">
      <motion.div 
        className="api-modal server-modal glass-panel"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="modal-header">
          <div className="header-left">
            <Server size={20} className="server-icon" style={{ color: 'var(--val-cyan)' }} />
            <h3 className="modal-title font-display">BACKEND SERVER SETUP</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Status Badge Row */}
        <div className="server-status-banner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} className={isConnected ? "pulse-icon" : ""} style={{ color: isConnected ? 'var(--val-green)' : 'var(--val-gold)' }} />
            <span className="font-display" style={{ fontSize: '0.85rem', color: '#fff' }}>
              CURRENT STATUS: <strong style={{ color: isConnected ? 'var(--val-green)' : 'var(--val-gold)' }}>{isConnected ? 'ONLINE & SYNCED' : 'OFFLINE / CONNECTING'}</strong>
            </span>
          </div>

          <button 
            type="button" 
            className="btn-val btn-secondary" 
            onClick={() => handleTestConnection(urlInput)}
            disabled={testing}
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <RefreshCw size={12} className={testing ? "spin-icon" : ""} />
            <span>{testing ? 'PINGING...' : 'PING SERVER'}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <label className="form-label font-display">ACTIVE BACKEND WEBSOCKET URL</label>
          <input 
            type="url"
            placeholder="https://valdraft-backend.onrender.com"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="api-key-input font-display"
            required
          />

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <button 
              type="button" 
              className="quick-btn" 
              onClick={() => setUrlInput('https://valdraft-backend.onrender.com')}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Default Render URL
            </button>
            <button 
              type="button" 
              className="quick-btn" 
              onClick={() => setUrlInput('http://localhost:8000')}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Localhost (8000)
            </button>
          </div>

          {testResult && (
            <div className={`status-alert ${testResult.success ? 'success' : 'error'} font-display`} style={{ marginTop: '8px' }}>
              {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="status-alert success font-display" style={{ marginTop: '8px' }}>
              <Check size={16} />
              <span>Backend URL updated! Reconnecting socket...</span>
            </div>
          )}

          {/* Render 1-Click Callout */}
          <div style={{
            marginTop: '12px',
            padding: '14px',
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: 'var(--radius-md)'
          }}>
            <h4 className="font-display" style={{ fontSize: '0.85rem', color: 'var(--val-cyan)', marginBottom: '4px', letterSpacing: '0.05em' }}>
              HOST BACKEND ON RENDER (1-CLICK FREE TIER)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 10px' }}>
              Render hosts the persistent Python WebSocket server for free. Click below to launch with your GitHub repository:
            </p>
            <a 
              href="https://render.com/deploy?repo=https://github.com/dhruvmakkar67/valdraft" 
              target="_blank" 
              rel="noreferrer"
              className="btn-val btn-cyan w-full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '8px 12px', fontSize: '0.8rem' }}
            >
              <span>DEPLOY TO RENDER BLUEPRINT</span>
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="modal-actions" style={{ marginTop: '14px' }}>
            <button type="button" className="btn-val btn-secondary" onClick={handleReset}>
              RESET
            </button>
            <button type="submit" className="btn-val btn-cyan">
              SAVE & CONNECT
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
