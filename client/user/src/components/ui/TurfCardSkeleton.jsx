const TurfCardSkeleton = () => {
  return (
    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden animate-pulse">
      <div className="h-64 bg-white/5"></div>
      <div className="p-8 pt-6">
        <div className="flex gap-2 mb-4">
          <div className="h-4 bg-white/5 rounded-md w-16"></div>
          <div className="h-4 bg-white/5 rounded-md w-16"></div>
        </div>
        <div className="h-8 bg-white/10 rounded-xl w-3/4 mb-2"></div>
        <div className="h-4 bg-white/5 rounded-md w-1/2 mb-6"></div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="h-12 bg-white/5 rounded-2xl"></div>
          <div className="h-12 bg-white/5 rounded-2xl"></div>
        </div>
        <div className="h-14 bg-white/10 rounded-2xl w-full"></div>
      </div>
    </div>
  );
};

export default TurfCardSkeleton;
