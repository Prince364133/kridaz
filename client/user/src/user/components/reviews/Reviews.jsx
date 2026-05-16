import { useState } from "react";
import useReviews from "../../hooks/useReviews";
import { format } from "date-fns";
import ReviewSkeleton from "../ui/ReviewSkeleton";
import { Link } from "react-router-dom";
import { ChevronDown, Star, Quote } from "lucide-react";

const Reviews = ({ turfId }) => {
  const { reviews, loading } = useReviews(turfId);

  if (loading) return <ReviewSkeleton />;

  return (
    <div className="space-y-8">
      {/* SVG Definitions for global gradient */}
      <svg width="0" height="0" className="hidden">
        <defs>
          <linearGradient id="theme-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#55DEE8" />
            <stop offset="100%" stopColor="#BFF367" />
          </linearGradient>
        </defs>
      </svg>

      {reviews.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-[15px] p-6 text-center">
          <Quote className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs font-inter">No feedback yet. Be the first to review!</p>
        </div>
      ) : (
        <>
          <div className="flex overflow-x-auto gap-4 pb-6 snap-x scroll-smooth no-scrollbar hover:no-scrollbar">
            {reviews.map((review, idx) => (
              <div 
                key={review._id} 
                className="shrink-0 w-[85vw] md:w-[380px] snap-start group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#55DEE8]/20 to-[#BFF367]/0 rounded-[15px] blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div 
                  className="relative h-full bg-[#121212] border border-zinc-800 group-hover:border-[#BFF367]/30 rounded-[15px] p-6 transition-all duration-300 animate-fade-in flex flex-col justify-between gap-6"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < review.rating ? "fill-[#BFF367] text-[#BFF367]" : "text-zinc-800"}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 font-inter">
                        {review.createdAt ? format(new Date(review.createdAt), "MMM d, yyyy") : "Recently"}
                      </span>
                    </div>
                    <div className="relative">
                      <Quote className="absolute -top-3 -left-2 w-10 h-10 text-[#55DEE8]/5 opacity-20" />
                      <p className="text-zinc-400 text-sm leading-relaxed relative z-10 font-medium font-inter italic">
                        "{review.comment}"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-zinc-800/50">
                    <Link 
                      to={`/profile/${review.user?._id}`}
                      className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#55DEE8] font-black text-sm uppercase group-hover:bg-gradient-to-r group-hover:from-[#55DEE8] group-hover:to-[#BFF367] group-hover:text-black transition-all duration-300 overflow-hidden relative z-10"
                    >
                      {review.user?.profilePicture ? (
                        <img 
                          src={review.user.profilePicture} 
                          alt={review.user.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{review.user?.name?.charAt(0) || "A"}</span>
                      )}
                    </Link>
                    <div>
                      <Link 
                        to={`/profile/${review.user?._id}`}
                        className="font-bold uppercase text-[10px] tracking-widest text-white mb-0.5 hover:text-[#BFF367] transition-colors relative z-10 font-inter"
                      >
                        {review.user?.name || "Anonymous Player"}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] animate-pulse"></div>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight font-inter">Verified Athlete</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-2 md:hidden">
            {reviews.slice(0, Math.min(reviews.length, 5)).map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === 0 ? "w-4 bg-[#BFF367]" : "w-1 bg-zinc-800"}`}></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Reviews;
