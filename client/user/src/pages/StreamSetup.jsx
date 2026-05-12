import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import { CheckCircle2, Copy, Eye, EyeOff, AlertTriangle, PlayCircle, Loader2 } from "lucide-react";

const StreamSetup = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streamData, setStreamData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    privacy: "public",
    resolution: "1080p",
    scheduledStart: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16),
  });
  const [thumbnail, setThumbnail] = useState(null);

  useEffect(() => {
    checkChannelAndStream();
  }, [matchId]);

  const checkChannelAndStream = async () => {
    try {
      setLoading(true);
      
      // Check channel
      const chanRes = await axiosInstance.get('/api/youtube/channel');
      setChannelInfo(chanRes.data);

      // Check stream status
      const statRes = await axiosInstance.get(`/api/youtube/stream/status/${matchId}`);
      if (statRes.data.success && statRes.data.youtubeVideoId) {
        // stream already exists
        // we might want to fetch details if we need them, but for now we just know it exists
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await axiosInstance.get('/api/youtube/oauth/start');
      window.location.href = res.data.url;
    } catch (err) {
      toast.error("Failed to start YouTube authentication");
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setIsGenerating(true);

      const form = new FormData();
      form.append("title", formData.title || "Live Cricket Match");
      form.append("description", formData.description);
      form.append("privacy", formData.privacy);
      form.append("resolution", formData.resolution);
      form.append("scheduledStart", new Date(formData.scheduledStart).toISOString());
      form.append("matchId", matchId);
      
      if (thumbnail) {
        form.append("thumbnail", thumbnail);
      }

      const res = await axiosInstance.post('/api/youtube/stream/create', form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        toast.success("Stream generated successfully!");
        setStreamData(res.data);
        
        // Notify scoring app if opened from there
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'STREAM_KEYS_READY',
            matchId: matchId,
            streamKey: res.data.streamKey,
            rtmpUrl: res.data.rtmpUrl,
            overlayUrl: res.data.overlayUrl
          }, window.location.origin);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create stream");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text, name) => {
    navigator.clipboard.writeText(text);
    toast.success(`${name} copied!`);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <PlayCircle className="text-red-500" size={32} />
        YouTube Live Setup
      </h1>

      {/* Account Status Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {channelInfo?.connected ? (
            <>
              <CheckCircle2 className="text-green-500" />
              <div>
                <p className="font-medium text-gray-900">Connected: {channelInfo.channelName}</p>
                <a href={channelInfo.youtubeStudioUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  YouTube Studio
                </a>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="text-yellow-500" />
              <p className="font-medium text-gray-900">Connect your YouTube channel to create streams</p>
            </>
          )}
        </div>
        {!channelInfo?.connected && (
          <button onClick={handleConnect} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Connect YouTube
          </button>
        )}
      </div>

      {channelInfo?.connected && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Create new stream</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                    value={formData.privacy}
                    onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  >
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || streamData}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating && <Loader2 className="animate-spin" size={20} />}
                {streamData ? "Keys Generated" : "Generate stream keys"}
              </button>
            </form>
          </div>

          {/* Stream Keys Display */}
          <div className="bg-gray-50 rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Your stream keys</h2>
            
            {!streamData ? (
              <div className="text-center text-gray-500 py-12">
                Generate keys to view them here.
              </div>
            ) : (
              <div className="space-y-4">
                {/* RTMP URL */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stream URL (RTMP)</label>
                  <div className="flex gap-2">
                    <input readOnly value={streamData.rtmpUrl} className="flex-1 bg-white border px-3 py-2 rounded-lg text-sm font-mono text-gray-800 outline-none" />
                    <button onClick={() => copyToClipboard(streamData.rtmpUrl, 'Stream URL')} className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                {/* Stream Key */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stream Key</label>
                  <div className="flex gap-2">
                    <input 
                      type={keyVisible ? "text" : "password"} 
                      readOnly 
                      value={streamData.streamKey} 
                      className="flex-1 bg-white border px-3 py-2 rounded-lg text-sm font-mono text-gray-800 outline-none" 
                    />
                    <button onClick={() => setKeyVisible(!keyVisible)} className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                      {keyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button onClick={() => copyToClipboard(streamData.streamKey, 'Stream Key')} className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                      <Copy size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-red-500 mt-1">Keep this key secret. Anyone with it can stream to your channel.</p>
                </div>

                {/* Overlay URL */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Score Overlay URL (For OBS Browser Source)</label>
                  <div className="flex gap-2">
                    <input readOnly value={streamData.overlayUrl} className="flex-1 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-sm font-mono text-blue-900 outline-none" />
                    <button onClick={() => copyToClipboard(streamData.overlayUrl, 'Overlay URL')} className="p-2 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700">
                      <Copy size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <a href={streamData.watchUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline text-sm">
                    Open on YouTube →
                  </a>
                  <button 
                    onClick={async () => {
                      if(window.confirm("Are you sure you want to end this stream?")) {
                        await axiosInstance.post(`/api/youtube/stream/end/${matchId}`);
                        toast.success("Stream ended");
                      }
                    }} 
                    className="text-red-600 hover:text-red-700 font-medium text-sm border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                  >
                    End stream
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamSetup;
