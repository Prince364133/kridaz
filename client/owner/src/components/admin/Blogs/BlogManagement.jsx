import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Edit2, FileText, Check, X, Eye, ThumbsUp } from "lucide-react";

export const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    content: "",
    imageUrl: "",
    readTime: "5 mins read",
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
    category: "Sports",
    author: "BookMySportz Team",
    views: "0",
    likes: "0",
    order: 0,
    status: "published",
  });

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/admin/blogs`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE, { withCredentials: true });
      setBlogs(response.data.blogs || []);
    } catch (error) {
      toast.error("Failed to fetch blogs");
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
        subtitle: "",
        content: "",
        imageUrl: "",
        readTime: "5 mins read",
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
        category: "Sports",
        author: "BookMySportz Team",
        views: "0",
        likes: "0",
        order: blogs.length + 1,
        status: "published",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_BASE}/${editingItem._id}`, formData, { withCredentials: true });
        toast.success("Blog updated successfully");
      } else {
        await axios.post(API_BASE, formData, { withCredentials: true });
        toast.success("Blog created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save blog");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`, { withCredentials: true });
      toast.success("Blog deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete blog");
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
            BLOG & ARTICLE HUB
          </h1>
          <p className="text-sm text-gray-400">
            Manage insights, stories, and deep dives from the sports world.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-lime-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-lime-400 transition-colors"
        >
          <Plus size={18} />
          Create New Article
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog, index) => (
          <div
            key={blog._id}
            className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#1A1A1A] overflow-hidden transition-all hover:border-lime-500/50"
          >
            <div className="aspect-[4/3] w-full bg-black overflow-hidden relative">
              <img 
                src={blog.imageUrl} 
                alt={blog.title} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
              />
              <div className="absolute top-4 left-4 font-display-heavy text-4xl text-white/10 italic">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-white/60">{blog.date}</span>
                <span className="text-[10px] font-bold text-lime-500 uppercase tracking-wider">{blog.readTime}</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent">
                <h3 className="font-display-heavy text-xl text-white leading-tight uppercase group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Eye size={14} className="text-lime-500/50" />
                  {blog.views}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <ThumbsUp size={14} className="text-lime-500/50" />
                  {blog.likes}
                </div>
                <div className="ml-auto px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  {blog.category}
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleOpenModal(blog)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <Edit2 size={14} />
                  Edit Details
                </button>
                <button
                  onClick={() => handleDelete(blog._id)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {blogs.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <FileText size={32} className="text-gray-600" />
            </div>
            <h3 className="text-white font-bold text-xl tracking-tight uppercase">No Articles Found</h3>
            <p className="text-gray-500 text-sm mt-1">Start by creating your first business article.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/40 relative z-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
                  {editingItem ? "Edit Article" : "Create Article"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">System Ready</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 relative z-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Headline</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all font-bold placeholder:text-white/10"
                    placeholder="ENTER ARTICLE HEADLINE..."
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Lead / Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all placeholder:text-white/10"
                    placeholder="Short summary for the card..."
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Article Image URL</label>
                  <input
                    type="text"
                    required
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all text-sm"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all appearance-none"
                  >
                    <option value="Sports">SPORTS</option>
                    <option value="Football">FOOTBALL</option>
                    <option value="Cricket">CRICKET</option>
                    <option value="Tennis">TENNIS</option>
                    <option value="Badminton">BADMINTON</option>
                    <option value="Insights">INSIGHTS</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Read Time</label>
                  <input
                    type="text"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all"
                    placeholder="e.g. 5 MINS READ"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Date String</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all"
                    placeholder="e.g. 23RD JULY 2024"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Article Content (Markdown/HTML)</label>
                  <textarea
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-lime-500 transition-all resize-none custom-scrollbar"
                    placeholder="Write your article content here..."
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Views (Simulated)</label>
                  <input
                    type="text"
                    value={formData.views}
                    onChange={(e) => setFormData({ ...formData, views: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Likes (Simulated)</label>
                  <input
                    type="text"
                    value={formData.likes}
                    onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-lime-500 text-black font-bold hover:bg-lime-400 transition-all shadow-[0_0_30px_rgba(132,204,22,0.4)] uppercase tracking-widest text-xs"
                >
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
