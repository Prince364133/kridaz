import { useState } from "react";
import useReviews from "../../hooks/useReviews";
import { format } from "date-fns";
import ReviewSkeleton from "../ui/ReviewSkeleton";
import { ChevronDown, Star, Quote } from "lucide-react";

const REVIEWS_PER_PAGE = 5;

const Reviews = ({ turfId }) => {
  const { reviews, loading } = useReviews(turfId);
  const [displayCount, setDisplayCount] = useState(REVIEWS_PER_PAGE);

  if (loading) return <ReviewSkeleton />;

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + REVIEWS_PER_PAGE);
  };

  return (
    <div className="space-y-8">
      {reviews.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-12 text-center">
          <Quote className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">No feedback yet. Be the first to review!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.slice(0, displayCount).map((review, idx) => (
              <div 
                key={review._id} 
                className="group bg-zinc-900/30 border border-zinc-800 hover:border-[#84CC16]/30 rounded-[2rem] p-8 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? "text-[#84CC16] fill-[#84CC16]" : "text-zinc-800"}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                        {review.createdAt ? format(new Date(review.createdAt), "MMM d, yyyy") : "Recently"}
                      </span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#84CC16] to-lime-700 flex items-center justify-center text-black font-black text-xs uppercase">
                      {review.user?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                      <p className="font-black uppercase text-[10px] tracking-widest text-white">
                        {review.user?.name || "Anonymous Player"}
                      </p>
                      <p className="text-[9px] text-[#84CC16] font-bold uppercase tracking-tighter">Verified Booking</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {displayCount < reviews.length && (
            <div className="flex justify-center mt-12">
              <button
                className="group flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-8 py-4 rounded-full font-black uppercase text-xs tracking-widest hover:border-[#84CC16] hover:text-[#84CC16] transition-all"
                onClick={handleLoadMore}
              >
                View More Feedback
                <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews;
