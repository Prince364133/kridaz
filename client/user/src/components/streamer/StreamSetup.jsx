import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, Key, Globe, Shield, RefreshCw, AlertCircle, Save, MonitorPlay, Youtube, CheckCircle2, Copy, Eye, EyeOff, Image as ImageIcon, History, Layers } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";

export default function StreamSetup() {
  const { id: paramId, matchId } = useParams();
  const id = paramId || matchId;
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // YouTube specific states
  const [channel, setChannel] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [channelLoading, setChannelLoading] = useState(true);
  
  // Form states
  const [generating, setGenerating] = useState(false);
  const [ending, setEnding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "Live cricket match broadcasted via Kridaz.",
    privacyStatus: "unlisted",
    resolution: "1080p"
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // Key masking
  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch match details
        const matchRes = await axiosInstance.get(`/api/hosted-game/find-by-id?id=${id}`);
        const matchData = matchRes.data.game;
        setMatch(matchData);
        
        setFormData(prev => ({
          ...prev,
          title: `${matchData.teams?.teamA?.name || 'Team A'} vs ${matchData.teams?.teamB?.name || 'Team B'} - Kridaz Live`
        }));

        // Fetch YouTube channel details
        try {
          const channelRes = await axiosInstance.get("/api/youtube/channel");
          if (channelRes.data.success && channelRes.data.channel) {
            setChannel(channelRes.data.channel);
            // Fetch past broadcasts if connected
            const broadcastsRes = await axiosInstance.get("/api/youtube/broadcasts");
            if (broadcastsRes.data.success) {
              setBroadcasts(broadcastsRes.data.broadcasts || []);
            }
          }
        } catch (err) {
          console.log("YouTube channel not connected or error", err);
        }
      } catch (err) {
        toast.error("Failed to load configuration");
      } finally {
        setLoading(false);
        setChannelLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleConnectYouTube = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:6001";
    const authUrl = `${baseUrl}/api/youtube/oauth/start`;
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      authUrl, 
      'YouTube Auth', 
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'YOUTUBE_OAUTH_SUCCESS') {
        toast.success("YouTube channel connected!");
        // Re-fetch data to show the channel info
        const fetchData = async () => {
          setChannelLoading(true);
          try {
            const configRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/youtube/config`);
            if (configRes.data.connected) {
              setChannel(configRes.data.channel);
            }
          } catch (err) {
            console.error("Error refreshing channel info", err);
          } finally {
            setChannelLoading(false);
          }
        };
        fetchData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleGenerateStream = async (e) => {
    e.preventDefault();
    if (!channel) {
      toast.error("Please connect your YouTube channel first.");
      return;
    }
    
    setGenerating(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('privacyStatus', formData.privacyStatus);
      submitData.append('resolution', formData.resolution);
      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      }

      const res = await axiosInstance.post(`/api/youtube/stream/create?matchId=${id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        toast.success("YouTube stream generated successfully!");
        setMatch(prev => ({
          ...prev,
          youtubeVideoId: res.data.streamConfig.youtubeVideoId,
          youtubeStreamKey: res.data.streamConfig.youtubeStreamKey,
          youtubeRtmpUrl: res.data.streamConfig.youtubeRtmpUrl,
          youtubeBroadcastId: res.data.streamConfig.youtubeBroadcastId,
          isLive: true
        }));

        // Notify parent window (Scoring App)
        if (window.opener) {
          window.opener.postMessage({
            type: 'STREAM_KEYS_READY',
            matchId: id
          }, window.location.origin);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate stream");
    } finally {
      setGenerating(false);
    }
  };

  const handleEndStream = async () => {
    if (!confirm("Are you sure you want to end this YouTube broadcast? This will finalize the video on YouTube.")) return;
    
    setEnding(true);
    try {
      const res = await axiosInstance.post(`/api/youtube/stream/end/${id}`);
      if (res.data.success) {
        toast.success("Broadcast ended successfully!");
        setMatch(prev => ({
          ...prev,
          isLive: false
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to end broadcast");
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <RefreshCw className="animate-spin text-violet-500 mb-4" size={32} />
        <p className="text-white font-bold uppercase tracking-widest text-xs">Loading Settings...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Match Not Found</h2>
        <button onClick={() => navigate(-1)} className="text-violet-500 text-xs font-bold uppercase tracking-widest hover:underline mt-4">
          Return
        </button>
      </div>
    );
  }

  const isStreamActive = match.isLive && match.youtubeStreamKey;
  const overlayUrl = `${window.location.origin}/live-overlay/${id}?token=${match.overlayToken || ''}`;
  const scoreboardUrl = `${window.location.origin}/live-score/${id}`;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-fade-in custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-white transition-colors">
                <Shield size={20} />
              </button>
              <span className="px-3 py-1 bg-violet-500/10 text-violet-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                Match ID: {match.shortId}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none flex items-center gap-4">
              <Youtube className="text-red-500" size={48} /> 
              YouTube <span className="text-violet-500">Live</span>
            </h1>
          </div>
        </div>

        {/* YouTube Connection Status Bar */}
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${channel ? 'bg-green-500/10 border-green-500/20' : 'bg-[#0A0A0A] border-white/10'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${channel ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500'}`}>
              {channel && channel.thumbnail ? (
                <img src={channel.thumbnail} alt="Channel" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Youtube size={24} />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                {channel ? channel.title : 'YouTube Not Connected'}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {channel ? 'Ready to broadcast to your channel' : 'Connect your YouTube account to generate stream keys directly.'}
              </p>
            </div>
          </div>
          
          {!channel && !channelLoading && (
            <button 
              onClick={handleConnectYouTube}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2"
            >
              <Youtube size={16} /> Connect YouTube
            </button>
          )}
          {channel && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 text-xs font-bold uppercase tracking-widest">
              <CheckCircle2 size={16} /> Connected
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Create Stream Form */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
              <Video className="text-violet-500" size={24} /> 1. Configure Broadcast
            </h2>
            
            <form onSubmit={handleGenerateStream} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Stream Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  disabled={isStreamActive}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold tracking-widest text-white focus:border-violet-500/50 outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Description</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={isStreamActive}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xs font-bold tracking-widest text-white focus:border-violet-500/50 outline-none transition-all resize-none disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Privacy</label>
                  <select 
                    value={formData.privacyStatus}
                    onChange={(e) => setFormData({...formData, privacyStatus: e.target.value})}
                    disabled={isStreamActive}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-violet-500/50 outline-none transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Quality</label>
                  <select 
                    value={formData.resolution}
                    onChange={(e) => setFormData({...formData, resolution: e.target.value})}
                    disabled={isStreamActive}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-bold uppercase tracking-widest text-white focus:border-violet-500/50 outline-none transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Thumbnail (1280x720)</label>
                <div 
                  onClick={() => !isStreamActive && fileInputRef.current?.click()}
                  className={`w-full h-32 bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden ${isStreamActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="text-gray-500 mb-2" size={24} />
                      <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Click to upload image</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png"
                  onChange={handleFileChange}
                />
              </div>

              <div className="pt-4">
                {!isStreamActive ? (
                  <button 
                    type="submit"
                    disabled={generating || !channel}
                    className="w-full h-14 bg-violet-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(139,92,246,0.2)] hover:shadow-violet-500/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? <RefreshCw size={16} className="animate-spin" /> : <MonitorPlay size={16} />}
                    {generating ? "Generating Stream..." : "Create YouTube Stream"}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleEndStream}
                    disabled={ending}
                    className="w-full h-14 bg-red-500/20 text-red-500 border border-red-500/30 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-red-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {ending ? <RefreshCw size={16} className="animate-spin" /> : <MonitorPlay size={16} />}
                    {ending ? "Ending..." : "End Broadcast"}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Keys and URLs */}
          <div className="space-y-6">
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                 <Key className="text-violet-500" size={24} /> 2. Encoder Setup
               </h2>
               
               {!isStreamActive ? (
                 <div className="h-48 flex flex-col items-center justify-center text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                   <AlertCircle className="text-gray-500 mb-3" size={32} />
                   <p className="text-xs text-gray-400 font-bold uppercase tracking-widest px-8">Create a stream first to generate your RTMP URL and Stream Key.</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                       RTMP Server URL
                       <button onClick={() => copyToClipboard(match.youtubeRtmpUrl, "RTMP URL")} className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                         <Copy size={12} /> Copy
                       </button>
                     </label>
                     <div className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 break-all">
                       {match.youtubeRtmpUrl}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                       Stream Key
                       <div className="flex gap-4">
                         <button onClick={() => setShowKey(!showKey)} className="text-gray-400 hover:text-white flex items-center gap-1">
                           {showKey ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Reveal</>}
                         </button>
                         <button onClick={() => copyToClipboard(match.youtubeStreamKey, "Stream Key")} className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                           <Copy size={12} /> Copy
                         </button>
                       </div>
                     </label>
                     <div className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 tracking-widest">
                       {showKey ? match.youtubeStreamKey : "••••••••••••••••••••••••••••"}
                     </div>
                   </div>
                 </div>
               )}
            </div>

            {/* Overlays */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                 <Layers className="text-violet-500" size={24} /> 3. Overlays
               </h2>
               
               <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                     OBS Browser Source (Score Overlay)
                     <button onClick={() => copyToClipboard(overlayUrl, "Overlay URL")} className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                       <Copy size={12} /> Copy
                     </button>
                   </label>
                   <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-400 truncate">
                     {overlayUrl}
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4 flex justify-between">
                     Viewer Scoreboard URL
                     <button onClick={() => copyToClipboard(scoreboardUrl, "Scoreboard URL")} className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                       <Copy size={12} /> Copy
                     </button>
                   </label>
                   <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-400 truncate">
                     {scoreboardUrl}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Previous Streams Panel */}
        {channel && (
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
              <History className="text-violet-500" size={24} /> Previous Broadcasts
            </h2>
            
            {broadcasts.length === 0 ? (
              <p className="text-sm text-gray-500 font-medium">No previous broadcasts found on this channel.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {broadcasts.map((b) => (
                  <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-violet-500/50 transition-colors">
                    <div className="h-32 bg-gray-900 relative">
                      <img src={b.snippet.thumbnails?.high?.url} alt={b.snippet.title} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-bold text-white line-clamp-1">{b.snippet.title}</p>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center bg-black">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {new Date(b.snippet.publishedAt).toLocaleDateString()}
                      </span>
                      <a href={`https://youtube.com/watch?v=${b.id}`} target="_blank" rel="noreferrer" className="text-violet-500 hover:text-white transition-colors">
                        <Youtube size={16} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

