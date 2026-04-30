const TurfCardSkeleton = () => {
  return (
    <div className="bg-[#0A0A0A] rounded-[2.5rem] border border-white/[0.05] overflow-hidden flex flex-col lg:flex-row h-auto lg:h-[340px] animate-pulse mb-6">
      {/* Image Skeleton */}
      <div className="w-full lg:w-[420px] h-[240px] lg:h-full bg-white/[0.03] shrink-0"></div>
      
      {/* Content Skeleton */}
      <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="h-10 bg-white/[0.05] rounded-xl w-3/4 mb-4"></div>
              <div className="h-4 bg-white/[0.03] rounded-md w-1/2"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03]"></div>
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03]"></div>
            </div>
          </div>
          
          <div className="flex gap-4 mb-8">
            <div className="h-8 bg-white/[0.05] rounded-xl w-32"></div>
            <div className="h-8 bg-white/[0.03] rounded-xl w-24"></div>
            <div className="h-8 bg-white/[0.03] rounded-xl w-24"></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 mt-auto">
          <div className="h-12 bg-white/[0.05] rounded-2xl w-40"></div>
          <div className="h-14 bg-white/[0.08] rounded-[1.25rem] flex-1 w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default TurfCardSkeleton;
