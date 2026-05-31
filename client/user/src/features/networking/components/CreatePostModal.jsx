import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { X, Image as ImageIcon, Loader2, Send, ChevronDown, Globe, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useCreatePostMutation, useUpdatePostMutation } from "@redux/api/communityApi";
import { startUpload } from "@redux/slices/mediaUploadSlice";
import toast from "react-hot-toast";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const CreatePostModal = ({ isOpen, onClose, editingPost, user }) => {
  const dispatch = useDispatch();
  const [createPost] = useCreatePostMutation();
  const [updatePost] = useUpdatePostMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sport, setSport] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
      setSport(editingPost.sport || "");
      setImage(null);
      setImagePreview(editingPost.image || editingPost.imageUrl || editingPost.mediaUrl || null);
    } else {
      setTitle("");
      setContent("");
      setSport("");
      setImage(null);
      setImagePreview(null);
    }
  }, [editingPost, isOpen]);

  if (!isOpen) return null;

  const handlePostImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) {
      return toast.error("Content or image is required");
    }

    setIsPublishing(true);
    try {
      if (editingPost && !editingPost.isPrefill) {
        const formData = new FormData();
        if (title) formData.append("title", title);
        if (content) formData.append("content", content);
        await updatePost({ postId: editingPost._id || editingPost.id, formData }).unwrap();
        toast.success("Post updated!");
        onClose();
      } else {
        if (image) {
          // Use Flash Upload (Backgrounding)
          dispatch(
            startUpload({
              id: Date.now().toString(),
              file: image,
              previewUrl: URL.createObjectURL(image),
              metadata: {
                type: "community",
                title,
                content: content || "",
                sport: sport || "",
              },
            })
          );
        } else {
          // Plain text post
          const formData = new FormData();
          formData.append("title", title);
          formData.append("content", content);
          if (sport) formData.append("sport", sport);
          await createPost(formData).unwrap();
          toast.success("Post created!");
        }
        onClose();
      }
    } catch (error) {
      toast.error(error?.data?.message || error.message || "Failed to save post");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ perspective: "1200px" }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#030303]/75 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95, rotateX: -8 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, y: 30, scale: 0.95, rotateX: 5 }}
        transition={{ type: "spring", damping: 25, stiffness: 240 }}
        className="relative w-full max-w-lg bg-neutral-950/80 border border-white/5 rounded-[8px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      >
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-[#BFF367]/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#BFF367]/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-base text-white tracking-wide" style={HEADING_STYLE}>
              {editingPost ? "Edit Post" : "Create Post"}
            </h3>
            <p className="text-[11px] text-neutral-500 font-medium tracking-tight mt-0.5" style={SUBHEADING_STYLE}>
              Share something with the community
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!editingPost && (
              <div className="relative">
                <select
                  className="border border-transparent rounded-[8px] py-1.5 pl-3 pr-8 text-white text-[10px] font-bold focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    backgroundImage: "linear-gradient(rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.95)), linear-gradient(to right, #BFF367, #BFF367)",
                    backgroundOrigin: "border-box",
                    backgroundClip: "padding-box, border-box",
                  }}
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="" className="bg-neutral-950 text-white">All Sports</option>
                  {["Cricket", "Football", "Rugby", "Baseball", "Hockey", "Athletics"].map((s) => (
                    <option key={s} value={s.toUpperCase()} className="bg-neutral-950 text-white">
                      {s}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                  <ChevronDown size={10} />
                </div>
              </div>
            )}

            <motion.button
              whileHover={{ rotate: 90, scale: 1.08, backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="p-1.5 rounded-full text-white/40 transition-colors cursor-pointer"
            >
              <X size={18} />
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 pt-3.5 pb-1 relative z-10">
          <img
            src={user?.profilePicture || "/default-avatar.png"}
            className="w-9 h-9 rounded-full object-cover border border-white/10 bg-neutral-900"
            alt=""
          />
          <div>
            <span className="text-xs font-bold text-white block tracking-wide" style={SUBHEADING_STYLE}>
              {user?.username || user?.name || "Player"}
            </span>
            <div className="flex items-center gap-1 text-[9px] font-bold text-[#BFF367] uppercase tracking-wider mt-0.5" style={SUBHEADING_STYLE}>
              <Globe size={10} />
              <span>Posting publicly</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreatePost} className="relative px-5 pb-5 pt-3 space-y-3.5 z-10">
          <div className="relative group/title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (Optional)"
              maxLength={80}
              style={SUBHEADING_STYLE}
              className="w-full bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 focus:border-[#BFF367]/30 focus:bg-white/[0.03] rounded-[8px] h-10 px-3.5 text-white text-xs outline-none transition-all duration-300 placeholder:text-white/20"
            />
            {title.length > 0 && (
              <span className="absolute right-3.5 top-3 text-[9px] font-bold text-neutral-500" style={SUBHEADING_STYLE}>
                {title.length}/80
              </span>
            )}
          </div>

          <div className="relative group/content">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What’s happening in your match? Share updates, highlights, or announcements…"
              maxLength={1000}
              style={SUBHEADING_STYLE}
              className="w-full bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 focus:border-[#BFF367]/30 focus:bg-white/[0.03] rounded-[8px] min-h-[100px] max-h-[200px] p-3.5 text-white text-xs outline-none transition-all duration-300 resize-none placeholder:text-white/20"
            />
            {content.length > 0 && (
              <span className="absolute right-3.5 bottom-3.5 text-[9px] font-bold text-neutral-500" style={SUBHEADING_STYLE}>
                {content.length}/1000
              </span>
            )}
          </div>

          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -5 }}
              className="relative h-36 w-full rounded-[8px] overflow-hidden border border-white/5 group shadow-lg"
            >
              <img src={imagePreview} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                <span className="text-[9px] font-bold text-white uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full border border-white/10" style={SUBHEADING_STYLE}>Image Selected</span>
              </div>
              {!editingPost && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08, backgroundColor: "#ef4444" }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 rounded-full text-white transition-colors cursor-pointer"
                >
                  <X size={12} />
                </motion.button>
              )}
            </motion.div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              {!editingPost && (
                <div className="relative">
                  <motion.button
                    type="button"
                    style={SUBHEADING_STYLE}
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(85,222,232,0.08)", border: "1px solid rgba(85,222,232,0.2)", color: "#BFF367" }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 bg-white/[0.02] border border-white/5 rounded-[8px] text-neutral-400 hover:text-[#BFF367] transition-all flex items-center justify-center cursor-pointer"
                    title="Add Image"
                  >
                    <ImageIcon size={16} />
                  </motion.button>
                  <input type="file" onChange={handlePostImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
              )}

              {image && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden sm:flex items-center gap-1.5 bg-neutral-900/60 border border-neutral-800 rounded-[8px] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-neutral-400"
                  style={SUBHEADING_STYLE}
                >
                  <ShieldCheck size={12} className="text-[#BFF367]" />
                  <span className="truncate max-w-[80px]">{image.name || "media.jpg"}</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
                whileTap={{ scale: 0.98 }}
                className="px-4 h-9 rounded-[8px] text-xs font-bold text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                disabled={isPublishing || (!content.trim() && !image)}
                style={SUBHEADING_STYLE}
                whileHover={{ scale: 1.03, boxShadow: "0px 8px 25px rgba(85,222,232,0.18)", filter: "brightness(1.04)" }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black px-5 h-9 rounded-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-25 disabled:cursor-not-allowed text-xs cursor-pointer group/publish"
              >
                {isPublishing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={12} className="group-hover/publish:translate-x-0.5 group-hover/publish:-translate-y-0.5 transition-transform duration-300" />
                )}
                {isPublishing ? "Saving..." : editingPost ? "Update" : "Post"}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;
