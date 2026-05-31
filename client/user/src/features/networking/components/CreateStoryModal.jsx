import { useState } from "react";
import { useDispatch } from "react-redux";
import { X, Image as ImageIcon, Loader2, Plus, ShieldCheck, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLazyGetStoryUploadUrlQuery, useConfirmStoryUploadMutation } from "@redux/api/communityApi";
import { startUpload } from "@redux/slices/mediaUploadSlice";
import { uploadFileToR2 } from "@utils/mediaUpload";
import toast from "react-hot-toast";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const CreateStoryModal = ({ isOpen, onClose, user }) => {
  const dispatch = useDispatch();
  const [getStoryUploadUrl] = useLazyGetStoryUploadUrlQuery();
  const [confirmStoryUpload] = useConfirmStoryUploadMutation();

  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [durationDays, setDurationDays] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const handleStoryMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error("Maximum 10 media files allowed");
      return;
    }
    setMediaFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setMediaPreviews(previews);
  };

  const handleUploadStory = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) {
      return toast.error("Story must have content or media");
    }

    // If exactly one media file and no content, use Flash Upload (Backgrounding)
    if (mediaFiles.length === 1 && !content.trim()) {
      const file = mediaFiles[0];
      dispatch(
        startUpload({
          id: Date.now().toString(),
          file,
          previewUrl: URL.createObjectURL(file),
          metadata: {
            type: "story",
            content: "",
            durationDays,
          },
        })
      );
      resetState();
      onClose();
      return;
    }

    setIsPublishing(true);
    try {
      const mediaItems = [];

      // 1. Upload each media file (Fallback for multi-file/text stories)
      for (const file of mediaFiles) {
        const { data: uploadData } = await getStoryUploadUrl({
          contentType: file.type,
          fileName: file.name,
        }).unwrap();

        await uploadFileToR2(uploadData.uploadUrl, file);

        mediaItems.push({
          key: uploadData.key,
          mediaType: file.type.startsWith("video") ? "video" : "image",
        });
      }

      // 2. Confirm Story
      await confirmStoryUpload({
        content,
        durationDays,
        mediaItems,
      }).unwrap();

      toast.success("Story uploaded!");
      resetState();
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || error.message || "Failed to upload story");
    } finally {
      setIsPublishing(false);
    }
  };

  const resetState = () => {
    setContent("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setDurationDays(1);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
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

        <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-white tracking-wide" style={HEADING_STYLE}>Create Story</h3>
            <p className="text-[11px] text-neutral-500 font-medium tracking-tight mt-0.5" style={SUBHEADING_STYLE}>
              Share quick updates with your community
            </p>
          </div>
          <motion.button
            whileHover={{ rotate: 90, scale: 1.08, backgroundColor: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}
            whileTap={{ scale: 0.92 }}
            onClick={handleClose}
            className="p-1.5 rounded-full text-white/40 transition-colors cursor-pointer"
          >
            <X size={18} />
          </motion.button>
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
          </div>
        </div>

        <form onSubmit={handleUploadStory} className="relative px-5 pb-5 pt-3 space-y-3.5 z-10">
          <div className="relative group/content">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a quick moment, match update, highlight, or announcement..."
              style={SUBHEADING_STYLE}
              className="w-full bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 focus:border-[#BFF367]/30 focus:bg-white/[0.03] rounded-[8px] h-20 p-3 text-white text-xs outline-none transition-all duration-300 resize-none placeholder:text-white/20"
            />
          </div>

          <div className="flex items-center justify-between bg-white/[0.01] border border-white/5 p-3 rounded-[8px]">
            <span className="text-xs text-neutral-400 font-bold" style={SUBHEADING_STYLE}>Expiry Duration</span>
            <div className="relative">
              <select
                className="border border-transparent rounded-[8px] py-1.5 pl-3 pr-8 text-white text-[10px] font-bold focus:outline-none transition-all appearance-none cursor-pointer"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  backgroundImage: "linear-gradient(rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.95)), linear-gradient(to right, #BFF367, #BFF367)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                }}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d} className="bg-neutral-950 text-white">
                    {d} {d === 1 ? "Day" : "Days"}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                <ChevronDown size={10} />
              </div>
            </div>
          </div>

          {mediaPreviews.length > 0 && (
            <div className="flex justify-center py-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-[9/16] h-52 rounded-[8px] overflow-hidden border border-white/5 group shadow-2xl bg-neutral-900"
              >
                <img src={mediaPreviews[0]} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-all duration-700" />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-bold text-white uppercase tracking-widest bg-black/60 px-2.5 py-1.5 rounded-full border border-white/10" style={SUBHEADING_STYLE}>Preview</span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08, backgroundColor: "#ef4444" }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setMediaFiles([]);
                    setMediaPreviews([]);
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 rounded-full text-white transition-colors cursor-pointer"
                  title="Remove media"
                >
                  <X size={12} />
                </motion.button>
              </motion.div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="relative">
                <motion.button
                  type="button"
                  style={SUBHEADING_STYLE}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(85,222,232,0.08)", border: "1px solid rgba(85,222,232,0.2)", color: "#BFF367" }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 bg-white/[0.02] border border-white/5 rounded-[8px] text-neutral-400 hover:text-[#BFF367] transition-all flex items-center justify-center cursor-pointer"
                  title="Upload Photo/Video"
                >
                  <ImageIcon size={16} />
                </motion.button>
                <input type="file" multiple onChange={handleStoryMediaChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
              </div>

              {mediaPreviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden sm:flex items-center gap-1.5 bg-neutral-900/60 border border-neutral-800 rounded-[8px] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-neutral-400"
                  style={SUBHEADING_STYLE}
                >
                  <ShieldCheck size={12} className="text-[#BFF367]" />
                  <span>{mediaPreviews.length} Selected</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={handleClose}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.03)" }}
                whileTap={{ scale: 0.98 }}
                className="px-4 h-9 rounded-[8px] text-xs font-bold text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </motion.button>

              <motion.button
                type="submit"
                disabled={isPublishing || (!content.trim() && mediaPreviews.length === 0)}
                style={SUBHEADING_STYLE}
                whileHover={{ scale: 1.03, boxShadow: "0px 8px 25px rgba(85,222,232,0.18)", filter: "brightness(1.04)" }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black px-5 h-9 rounded-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-25 disabled:cursor-not-allowed text-xs cursor-pointer group/story"
              >
                {isPublishing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={12} className="group-hover/story:scale-110 transition-transform duration-300" />
                )}
                {isPublishing ? "Posting..." : "Post Story"}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateStoryModal;
