import React, { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export const YouTubeConnected = () => {
  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'YOUTUBE_OAUTH_SUCCESS' }, window.location.origin);
      setTimeout(() => window.close(), 2000);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connected!</h1>
        <p className="text-gray-500 mb-6">Your YouTube channel is now connected.</p>
        <button 
          onClick={() => window.close()} 
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          Close Window
        </button>
      </div>
    </div>
  );
};

export const YouTubeError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h1>
        <p className="text-gray-500 mb-6">We couldn't connect your YouTube channel. Please try again.</p>
        <button 
          onClick={() => window.close()} 
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg transition-colors"
        >
          Close Window
        </button>
      </div>
    </div>
  );
};
