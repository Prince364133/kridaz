import React, { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { Star, MessageSquare, Send, Loader2, Reply } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function CoachReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // We can use getProfessionalById or a dedicated endpoint. 
      // For now, let's assume we fetch all reviews for the current user (professional)
      const res = await axiosInstance.get(`/api/professional/details/${localStorage.getItem('userId')}?date=${format(new Date(), 'yyyy-MM-dd')}`);
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      setActionLoading(true);
      await axiosInstance.post("/api/professional/review/reply", { reviewId, reply: replyText });
      toast.success("Reply posted successfully");
      setReplyText("");
      setReplyingTo(null);
      fetchReviews();
    } catch (error) {
      console.error("Error replying:", error);
      toast.error("Failed to post reply");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
  );

  return (
    <div className="space-y-8 animate-fade-in font-open-sans">
      <div className="pb-6 border-b border-white/5">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white font-inter">
          User <span className="text-[#BFF367]">Reviews</span>
        </h1>
        <p className="text-[#999999] text-xs font-semibold uppercase tracking-wider font-inter mt-1">Engage with your students and players</p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#000000] rounded-[8px] border border-dashed border-[#2D2D2D] p-12 text-center shadow-[var(--shadow-2)]">
          <MessageSquare size={48} className="text-[#2D2D2D] mb-4" />
          <h3 className="text-[13px] font-semibold text-[#555] uppercase tracking-wider font-inter mb-2">No Reviews Yet</h3>
          <p className="text-[11px] text-[#444] font-inter">Feedback from your clients will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden group hover:border-[#BFF367]/30 transition-all shadow-[var(--shadow-2)]">
              <div className="p-6 lg:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <img src={review.user?.profilePicture} className="w-12 h-12 rounded-[6px] border border-[#2D2D2D]" />
                    <div>
                      <h4 className="text-lg font-bold text-white tracking-tight font-inter">{review.user?.name}</h4>
                      <p className="text-[10px] font-medium text-[#878C9F] uppercase tracking-wider font-inter">{format(new Date(review.createdAt), 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? "fill-[#BFF367] text-[#BFF367]" : "text-[#2D2D2D]"} />
                    ))}
                  </div>
                </div>

                <div className="relative p-6 bg-[#2D2D2D]/20 border border-[#2D2D2D] rounded-[6px] mb-6">
                   <p className="text-[13px] text-[#999999] italic font-open-sans">"{review.comment}"</p>
                </div>

                {review.reply ? (
                  <div className="ml-8 p-6 bg-[#BFF367]/5 border-l-4 border-[#BFF367] rounded-r-[6px]">
                    <p className="text-[10px] font-bold text-[#BFF367] uppercase tracking-wider mb-2 flex items-center gap-2 font-inter">
                      <Reply size={12} /> Your Response
                    </p>
                    <p className="text-[13px] text-[#999999] italic font-open-sans">"{review.reply}"</p>
                    <p className="text-[9px] font-medium text-[#878C9F] uppercase tracking-wider mt-2 font-inter">{format(new Date(review.replyDate), 'MMMM dd, yyyy')}</p>
                  </div>
                ) : replyingTo === review._id ? (
                  <div className="ml-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <textarea 
                      placeholder="Type your response..."
                      className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[6px] p-4 text-[13px] text-white focus:border-[#BFF367] outline-none h-24 resize-none font-open-sans"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleReply(review._id)}
                        disabled={actionLoading}
                        className="flex-1 h-12 bg-[#BFF367] text-black rounded-[6px] font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 hover:scale-[0.98] transition-all font-inter shadow-[var(--shadow-2)]"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Post Reply
                      </button>
                      <button 
                        onClick={() => setReplyingTo(null)}
                        className="px-6 h-12 bg-transparent text-[#999999] hover:text-white border border-[#2D2D2D] rounded-[6px] font-bold uppercase text-[11px] tracking-widest font-inter transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingTo(review._id)}
                    className="ml-8 text-[11px] font-bold text-[#BFF367] uppercase tracking-wider flex items-center gap-2 hover:translate-x-2 transition-transform font-inter"
                  >
                    <MessageSquare size={14} /> Reply to Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
