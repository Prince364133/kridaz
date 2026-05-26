import React from "react";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, MessageCircleReply, Activity } from "lucide-react";
import useOwnerReviews from "@hooks/owner/useOwnerReviews";
import ReviewsSkeleton from "./ReviewSkeleton";
import { useNavigate } from "react-router-dom";

const OwnerReviews = () => {
  const { turfs, selectedTurf, setSelectedTurf, loading, error } = useOwnerReviews();
  const navigate = useNavigate();

  if (loading) return <ReviewsSkeleton />;
  if (error) return <div className="text-red-500 p-4 font-bold uppercase tracking-wider">{error}</div>;

  const currentTurf = turfs.find((t) => t.id === selectedTurf);
  const reviews = currentTurf?.reviews || [];
  
  // Analytics Calculations
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : 0;
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const criticalReviews = reviews.filter(r => r.rating <= 2).length;
  
  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#55DEE8]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#55DEE8]/5 blur-[120px] pointer-events-none" />
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-[#2D2D2D] pb-6">
        <div>
          <div className="flex items-center gap-3">
             <MessageSquare className="text-[#55DEE8]" size={32} />
             <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] tracking-tight uppercase leading-none">Customer Reviews</h1>
          </div>
          <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-11">Monitor player sentiment and service quality.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: Venue Selection */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 shadow-[var(--shadow-2)]">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-3 bg-[#55DEE8] rounded-full" />
                <h3 className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px]">Select Arena</h3>
             </div>
             
             <ul className="space-y-3">
               {turfs.map((turf) => (
                 <li key={turf.id}>
                   <button
                     className={`w-full text-left p-4 rounded-[6px] border transition-all flex justify-between items-center group ${ selectedTurf === turf.id ? "bg-[#55DEE8]/10 border-[#55DEE8]/40 text-white" : "bg-[#1A1A1A] border-[#2D2D2D] text-[#878C9F] hover:border-[#55DEE8]/20 hover:text-white" }`}
                     onClick={() => setSelectedTurf(turf.id)}
                   >
                     <span className="font-bold text-[13px] uppercase tracking-widest">{turf.name}</span>
                     <span className={`px-2 py-1 rounded-[4px] font-bold text-[11px] flex items-center gap-1.5 ${ selectedTurf === turf.id ? "bg-[#55DEE8] text-black" : "bg-[#111] text-[#878C9F] border border-[#2D2D2D] group-hover:text-[#55DEE8]" }`}>
                       <Star size={11} className={selectedTurf === turf.id ? "fill-black" : ""} />
                       {turf.avgRating.toFixed(1)}
                     </span>
                   </button>
                 </li>
               ))}
             </ul>
          </div>
        </div>

        {/* Right Content Area: Analytics & Reviews */}
        <div className="w-full lg:w-2/3 space-y-6">
          {currentTurf ? (
            <>
              {/* Analytics Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#55DEE8]/30 transition-all duration-500">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Star size={40} className="text-[#55DEE8] fill-[#55DEE8]" />
                   </div>
                   <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-1">Average Score</p>
                   <h3 className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-2">
                      {avgRating} <span className="text-[12px] text-[#878C9F]">/ 5.0</span>
                   </h3>
                </div>
                
                <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#55DEE8]/30 transition-all duration-500">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ThumbsUp size={40} className="text-emerald-500" />
                   </div>
                   <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-1">Positive Sentiment</p>
                   <h3 className="text-2xl font-semibold text-emerald-500 tracking-tight">{positiveReviews}</h3>
                   <p className="text-[11px] text-[#444] mt-1 font-medium tracking-wide">4-5 Star Ratings</p>
                </div>
                
                <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#55DEE8]/30 transition-all duration-500">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ThumbsDown size={40} className="text-red-500" />
                   </div>
                   <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-1">Critical Reviews</p>
                   <h3 className="text-2xl font-semibold text-red-500 tracking-tight">{criticalReviews}</h3>
                   <p className="text-[11px] text-[#444] mt-1 font-medium tracking-wide">1-2 Star Ratings</p>
                </div>
              </div>

              {/* Review List */}
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 space-y-6 shadow-[var(--shadow-2)]">
                <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
                  <h2 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 bg-[#55DEE8] rounded-full"></span>
                     Feedback Logs ({totalReviews})
                  </h2>
                </div>

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-[#1A1A1A] border border-[#2D2D2D] p-5 rounded-[8px] hover:border-[#55DEE8]/30 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => review.user?._id && navigate(`/profile/${review.user._id}`)}
                              className="w-10 h-10 rounded-full border border-white/10 overflow-hidden cursor-pointer hover:border-[#55DEE8] transition-all"
                            >
                               {review.user?.profilePicture ? (
                                 <img src={review.user.profilePicture} alt={review.userName} className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-400">
                                   {review.userName.charAt(0)}
                                 </div>
                               )}
                            </div>
                            <div>
                              <h3 
                                onClick={() => review.user?._id && navigate(`/profile/${review.user._id}`)}
                                className="text-[13px] font-bold text-white uppercase tracking-widest cursor-pointer hover:text-[#55DEE8] transition-colors"
                              >
                                {review.userName}
                              </h3>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-[#55DEE8] uppercase tracking-widest">Verified Booking</p>
                                <span className="text-[8px] text-gray-500">ΓÇó</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-[#111] px-2 py-1 rounded-[4px] border border-[#2D2D2D]">
                             {[...Array(5)].map((_, i) => (
                               <Star 
                                 key={i} 
                                 size={10} 
                                 className={`${i < review.rating ? "text-[#55DEE8] fill-[#55DEE8]" : "text-[#333]"}`} 
                               />
                             ))}
                          </div>
                        </div>
                        <p className="text-[#878C9F] text-sm leading-relaxed mb-4">
                          "{review.comment}"
                        </p>
                        <div className="flex justify-end border-t border-[#2D2D2D] pt-3">
                           <button className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest hover:text-[#55DEE8] flex items-center gap-1.5 transition-colors">
                              <MessageCircleReply size={12} /> Respond to Customer
                           </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#2D2D2D] rounded-[8px] bg-[#000000]">
                      <Activity size={32} className="text-[#333] mb-4" />
                      <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px]">
                        No telemetry data available.
                      </p>
                      <p className="text-[11px] text-[#444] mt-2 font-medium tracking-wide italic">Awaiting customer engagement metrics.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-[#2D2D2D] rounded-[8px] bg-[#000000] shadow-[var(--shadow-2)]">
              <Activity size={40} className="text-[#333] mb-4" />
              <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px]">
                Select a facility to initialize telemetry stream.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default OwnerReviews;

