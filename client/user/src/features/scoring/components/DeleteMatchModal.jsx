import React, { useState } from 'react';
import { Trash2, Loader2, X } from 'lucide-react';

const DeleteMatchModal = ({ matchId, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const THEME_COLOR = '#EF4444'; // Red for delete

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:6001';
      const response = await fetch(`${apiBase}/api/scoring/match/${matchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Incorrect password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-[#000] border border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-center relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Trash2 size={24} style={{ color: THEME_COLOR }} /> Delete
          </h3>
          {onClose && (
            <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-neutral-400 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="space-y-2 relative z-10">
          <p className="text-xs font-black uppercase text-neutral-500 tracking-[0.2em]">Permanently Delete Match</p>
          <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest leading-relaxed">
            This action cannot be undone. Enter the scoring password to confirm deletion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Enter Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-sm focus:border-red-500 outline-none text-white font-bold tracking-widest transition-all"
            />
            {error && (
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest pl-2 animate-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: loading ? '#EF444480' : THEME_COLOR, 
              color: '#fff', 
              boxShadow: `0 10px 30px ${THEME_COLOR}33` 
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Delete Match'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeleteMatchModal;
