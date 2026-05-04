 import { Star } from "lucide-react";
import useOwnerReviews from "@hooks/owner/useOwnerReviews";
import ReviewsSkeleton from "./ReviewSkeleton"
const OwnerReviews = () => {
  const { turfs, selectedTurf, setSelectedTurf, loading, error } =
    useOwnerReviews();

  if (loading) return <ReviewsSkeleton />;
  if (error) return <div className="text-error p-4">{error}</div>;

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="space-y-12">
        <header className="mb-12 border-l-8 border-primary pl-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white uppercase">
            CUSTOMER <span className="text-primary">REVIEWS</span>
          </h1>
          <p className="text-gray-500 uppercase tracking-widest mt-2 text-sm">
            Review Management | BookMySportz
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-1/3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Select Turf</h3>
            <ul className="space-y-3">
              {turfs.map((turf) => (
                <li key={turf.id}>
                  <button
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center group ${
                      selectedTurf === turf.id 
                        ? "bg-primary border-primary text-black" 
                        : "bg-[#111] border-gray-800 text-white hover:border-primary"
                    }`}
                    onClick={() => setSelectedTurf(turf.id)}
                  >
                    <span className="font-bold text-lg uppercase tracking-tight">{turf.name}</span>
                    <span className={`px-2 py-1 rounded font-bold text-xs flex items-center gap-1 ${
                      selectedTurf === turf.id ? "bg-black text-primary" : "bg-[#1a1a1a] text-gray-400 group-hover:text-primary"
                    }`}>
                      <Star size={10} className={selectedTurf === turf.id ? "fill-primary" : "fill-transparent"} />
                      {turf.avgRating.toFixed(1)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full lg:w-2/3">
            {selectedTurf ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-8 uppercase tracking-tight flex items-center gap-4">
                   <span className="w-8 h-1 bg-primary"></span>
                   {turfs.find((t) => t.id === selectedTurf).name} Reviews
                </h2>
                <div className="space-y-6">
                  {turfs
                    .find((t) => t.id === selectedTurf)
                    .reviews.map((review) => (
                      <div key={review.id} className="bg-[#111] border border-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Star size={80} className="fill-primary text-primary" />
                        </div>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                              {review.userName}
                            </h3>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Verified Customer</div>
                          </div>
                          <div className="flex items-center gap-1 bg-[#1a1a1a] px-3 py-1 rounded-lg border border-gray-800">
                             {[...Array(5)].map((_, i) => (
                               <Star 
                                 key={i} 
                                 size={12} 
                                 className={`${i < review.rating ? "text-primary fill-primary" : "text-gray-800"}`} 
                               />
                             ))}
                          </div>
                        </div>
                        <p className="text-gray-400 leading-relaxed italic border-l-4 border-white/10 pl-6 py-2 group-hover:border-primary transition-all">
                          "{review.comment}"
                        </p>
                      </div>
                    ))}
                  {turfs.find((t) => t.id === selectedTurf).reviews.length === 0 && (
                    <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800">
                      <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">
                        No customer reviews received for this turf yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-[#111] rounded-2xl border border-dashed border-gray-800 opacity-50">
                <Star size={48} className="text-gray-700 mb-4" />
                <p className="text-gray-600 uppercase tracking-widest text-sm font-bold">
                  Select a turf to view customer reviews
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
