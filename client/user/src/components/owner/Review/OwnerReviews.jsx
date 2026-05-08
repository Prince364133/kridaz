import React from "react";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, MessageCircleReply, Activity } from "lucide-react";
import useOwnerReviews from "@hooks/owner/useOwnerReviews";
import ReviewsSkeleton from "./ReviewSkeleton";

const OwnerReviews = () => {
  const { turfs, selectedTurf, setSelectedTurf, loading, error } = useOwnerReviews();

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
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white font-inter bg-[#050505] min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2D2D2D] pb-6">
        <div>
          <div className="flex items-center gap-3">
             <MessageSquare className="text-[#CCFF00]" size={28} />
             <h1 className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">Customer Reviews</h1>
          </div>
          <p className="text-[#878C9F] text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Monitor player sentiment and service quality.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: Venue Selection */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-3 bg-[#CCFF00] rounded-full" />
                <h3 className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[2px]">Select Arena</h3>
             </div>
             
             <ul className="space-y-3">
               {turfs.map((turf) => (
                 <li key={turf.id}>
                   <button
                     className={`w-full text-left p-4 rounded-[8px] border transition-all flex justify-between items-center group ${
                       selectedTurf === turf.id 
                         ? "bg-[#CCFF00]/10 border-[#CCFF00]/40 text-white" 
                         : "bg-[#1A1A1A] border-[#2D2D2D] text-[#878C9F] hover:border-[#CCFF00]/20 hover:text-white"
                     }`}
                     onClick={() => setSelectedTurf(turf.id)}
                   >
                     <span className="font-bold text-sm uppercase tracking-tight">{turf.name}</span>
                     <span className={`px-2 py-1 rounded-[4px] font-bold text-[10px] flex items-center gap-1.5 ${
                       selectedTurf === turf.id ? "bg-[#CCFF00] text-black" : "bg-[#111] text-[#878C9F] border border-[#2D2D2D] group-hover:text-[#CCFF00]"
                     }`}>
                       <Star size={10} className={selectedTurf === turf.id ? "fill-black" : ""} />
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
                <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Star size={40} className="text-[#CCFF00] fill-[#CCFF00]" />
                   </div>
                   <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Average Score</p>
                   <h3 className="text-3xl font-bold font-outfit flex items-baseline gap-2">
                      {avgRating} <span className="text-sm text-[#878C9F]">/ 5.0</span>
                   </h3>
                </div>
                
                <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ThumbsUp size={40} className="text-emerald-500" />
                   </div>
                   <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Positive Sentiment</p>
                   <h3 className="text-3xl font-bold font-outfit text-emerald-500">{positiveReviews}</h3>
                   <p className="text-[10px] text-[#444] mt-1 uppercase tracking-wider font-bold">4-5 Star Ratings</p>
                </div>
                
                <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-5 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ThumbsDown size={40} className="text-red-500" />
                   </div>
                   <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Critical Reviews</p>
                   <h3 className="text-3xl font-bold font-outfit text-red-500">{criticalReviews}</h3>
                   <p className="text-[10px] text-[#444] mt-1 uppercase tracking-wider font-bold">1-2 Star Ratings</p>
                </div>
              </div>

              {/* Review List */}
              <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 bg-[#CCFF00] rounded-full"></span>
                     Feedback Logs ({totalReviews})
                  </h2>
                </div>

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="bg-[#1A1A1A] border border-[#2D2D2D] p-5 rounded-[8px] hover:border-[#CCFF00]/30 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                              {review.userName}
                            </h3>
                            <p className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest mt-0.5">Verified Booking</p>
                          </div>
                          <div className="flex items-center gap-1 bg-[#111] px-2 py-1 rounded-[4px] border border-[#2D2D2D]">
                             {[...Array(5)].map((_, i) => (
                               <Star 
                                 key={i} 
                                 size={10} 
                                 className={`${i < review.rating ? "text-[#CCFF00] fill-[#CCFF00]" : "text-[#333]"}`} 
                               />
                             ))}
                          </div>
                        </div>
                        <p className="text-[#878C9F] text-sm leading-relaxed mb-4">
                          "{review.comment}"
                        </p>
                        <div className="flex justify-end border-t border-[#2D2D2D] pt-3">
                           <button className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest hover:text-[#CCFF00] flex items-center gap-1.5 transition-colors">
                              <MessageCircleReply size={12} /> Respond to Customer
                           </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#2D2D2D] rounded-[8px] bg-[#0A0A0A]">
                      <Activity size={32} className="text-[#333] mb-4" />
                      <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">
                        No telemetry data available.
                      </p>
                      <p className="text-[9px] text-[#444] mt-1 uppercase tracking-wider">Awaiting customer engagement metrics.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-[#2D2D2D] rounded-[12px] bg-[#111111]">
              <Activity size={40} className="text-[#333] mb-4" />
              <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">
                Select a facility to initialize telemetry stream.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerReviews;

