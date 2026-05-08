import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { Star, MessageSquare, Send, User, Loader2, Calendar, Reply } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function ProfessionalReviews() {
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
    <div className="space-y-8 animate-fade-in">
      <div className="pb-6 border-b border-white/5">
        <h1 className="text-5xl font-black uppercase tracking-tight text-white">
          User <span className="text-primary">Reviews</span>
        </h1>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Engage with your students and players</p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#0A0A0A] rounded-[32px] border border-white/5 border-dashed p-12 text-center">
          <MessageSquare size={48} className="text-white/10 mb-4" />
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-2">No Reviews Yet</h3>
          <p className="text-gray-500 text-sm">Feedback from your clients will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-[#0A0A0A] border border-white/5 rounded-[32px] overflow-hidden group hover:border-primary/20 transition-all">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <img src={review.user?.profilePicture} className="w-12 h-12 rounded-xl" />
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">{review.user?.name}</h4>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{format(new Date(review.createdAt), 'MMMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? "fill-primary text-primary" : "text-white/10"} />
                    ))}
                  </div>
                </div>

                <div className="relative p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
                   <p className="text-sm text-gray-400 italic">"{review.comment}"</p>
                </div>

                {review.reply ? (
                  <div className="ml-8 p-6 bg-primary/5 border-l-4 border-primary rounded-r-2xl">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Reply size={12} /> Your Response
                    </p>
                    <p className="text-sm text-gray-300 italic">"{review.reply}"</p>
                  </div>
                ) : replyingTo === review._id ? (
                  <div className="ml-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <textarea 
                      placeholder="Type your response..."
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-primary outline-none h-24 resize-none"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleReply(review._id)}
                        disabled={actionLoading}
                        className="flex-1 h-12 bg-primary text-black rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[0.98] transition-all"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Post Reply
                      </button>
                      <button 
                        onClick={() => setReplyingTo(null)}
                        className="px-6 h-12 bg-white/5 text-white border border-white/10 rounded-xl font-black uppercase text-xs tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingTo(review._id)}
                    className="ml-8 text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform"
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
