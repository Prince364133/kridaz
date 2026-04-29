import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit2, Layout, Video, Check, X, GripVertical } from "lucide-react";

export const MarketingManagement = () => {
  const [activeTab, setActiveTab] = useState("banners");
  const [banners, setBanners] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    targetUrl: "",
    youtubeUrl: "",
    order: 0,
    isActive: true,
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/admin/marketing`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannersRes, videosRes] = await Promise.all([
        axios.get(`${API_BASE}/banners`, { withCredentials: true }),
        axios.get(`${API_BASE}/videos`, { withCredentials: true }),
      ]);
      setBanners(bannersRes.data.banners || []);
      setVideos(videosRes.data.videos || []);
    } catch (error) {
      toast.error("Failed to fetch marketing data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        title: "",
        imageUrl: "",
        targetUrl: "",
        youtubeUrl: "",
        order: (activeTab === "banners" ? banners.length : videos.length) + 1,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_BASE}/${activeTab}/${editingItem._id}`, formData, { withCredentials: true });
        toast.success("Updated successfully");
      } else {
        await axios.post(`${API_BASE}/${activeTab}`, formData, { withCredentials: true });
        toast.success("Created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save data");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API_BASE}/${activeTab}/${id}`, { withCredentials: true });
      toast.success("Deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-lime-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-bebas">
            MARKETING HUB
          </h1>
          <p className="text-sm text-gray-400">
            Manage your homepage ad banners and video features.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-lime-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-lime-400 transition-colors"
        >
          <Plus size={18} />
          Add New {activeTab === "banners" ? "Banner" : "Video"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("banners")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === "banners" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layout size={16} />
            Ad Banners
          </div>
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === "videos" ? "border-lime-500 text-lime-500" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Video size={16} />
            Dynamic Videos
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(activeTab === "banners" ? banners : videos).map((item) => (
          <div
            key={item._id}
            className="group relative flex flex-col rounded-xl border border-white/10 bg-[#1A1A1A] overflow-hidden transition-all hover:border-lime-500/50"
          >
            {activeTab === "banners" ? (
              <div className="aspect-video w-full bg-black overflow-hidden relative">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                {!item.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Inactive</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full bg-black flex items-center justify-center relative">
                <Video size={40} className="text-lime-500/30" />
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] text-gray-400 font-mono">
                  YOUTUBE
                </div>
                {!item.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Inactive</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white truncate pr-4">{item.title}</h3>
                <span className="text-xs font-mono text-lime-500">#{item.order}</span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-4">
                {activeTab === "banners" ? item.targetUrl || "No target URL" : item.youtubeUrl}
              </p>

              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {((activeTab === "banners" ? banners : videos).length === 0) && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl">
            <Layout size={40} className="text-gray-600 mb-4" />
            <h3 className="text-white font-bold">No {activeTab} found</h3>
            <p className="text-gray-400 text-sm">Start by adding your first marketing asset.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold font-bebas tracking-wider text-white">
                {editingItem ? "EDIT" : "ADD NEW"} {activeTab.toUpperCase().slice(0, -1)}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors"
                  placeholder="Campaign Title"
                />
              </div>

              {activeTab === "banners" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Image URL (or GIF)</label>
                    <input
                      type="text"
                      required
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Target URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">YouTube URL</label>
                  <input
                    type="text"
                    required
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-lime-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Status</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-full py-2.5 rounded-lg border font-bold text-xs uppercase tracking-widest transition-all ${
                      formData.isActive ? "bg-lime-500/10 border-lime-500 text-lime-500" : "bg-red-500/10 border-red-500 text-red-500"
                    }`}
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-lime-500 text-black font-bold hover:bg-lime-400 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)]"
                >
                  SAVE {activeTab.toUpperCase().slice(0, -1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
