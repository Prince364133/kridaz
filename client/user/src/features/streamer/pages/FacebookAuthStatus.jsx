import React, { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export const FacebookConnected = () => {
  useEffect(() => {
    // Notify the parent window
    const notifyOpener = () => {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'FACEBOOK_OAUTH_SUCCESS' }, "*");
        }
      } catch (err) {
        console.error("Failed to notify opener via postMessage:", err);
      }

      // Fallback: Use localStorage to communicate success
      try {
        localStorage.setItem('facebook_oauth_status', 'success_' + Date.now());
      } catch (err) {
        console.error("Failed to set localStorage:", err);
      }
    };

    notifyOpener();

    // Automatically close after 3 seconds
    const timer = setTimeout(() => {
      window.close();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4 text-white font-sans">
      <div className="bg-[#111111] p-10 rounded-[2.5rem] border border-white/10 text-center max-w-sm w-full shadow-2xl">
        <div className="w-20 h-20 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 animate-bounce">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-3">Connected!</h1>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-8">
          Facebook Page linked successfully.
        </p>
        <div className="space-y-4">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] animate-pulse">
            Closing window in 3 seconds...
          </p>
          <button 
            onClick={() => window.close()} 
            className="w-full bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl border border-white/10 transition-all active:scale-95"
          >
            Close Now
          </button>
        </div>
      </div>
    </div>
  );
};

export const FacebookError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4 text-white font-sans">
      <div className="bg-[#111111] p-10 rounded-[2.5rem] border border-white/10 text-center max-w-sm w-full shadow-2xl">
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
          <XCircle size={40} />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-3">Failed</h1>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-8">
          Could not connect Facebook account.
        </p>
        <button 
          onClick={() => window.close()} 
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(220,38,38,0.2)] active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
