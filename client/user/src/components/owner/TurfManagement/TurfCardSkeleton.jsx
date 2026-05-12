const TurfCardSkeleton = () => {
 return (
 <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden animate-pulse h-full flex flex-col">
 <div className="h-40 bg-[#0A0A0A] relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#111] to-transparent animate-shimmer" />
 </div>
 
 <div className="p-4 space-y-4 flex-grow">
 <div className="flex justify-between items-start">
 <div className="space-y-2 flex-1">
 <div className="h-4 bg-[#111] rounded-[4px] w-3/4"></div>
 <div className="h-3 bg-[#111] rounded-[4px] w-1/2"></div>
 </div>
 <div className="h-5 bg-[#111] rounded-[4px] w-10"></div>
 </div>

 <div className="space-y-2">
 <div className="h-3 bg-[#111] rounded-[4px] w-full"></div>
 <div className="h-3 bg-[#111] rounded-[4px] w-full opacity-60"></div>
 </div>

 <div className="flex gap-1.5 mt-auto">
 <div className="h-4 bg-[#111] rounded-[4px] w-12"></div>
 <div className="h-4 bg-[#111] rounded-[4px] w-16"></div>
 </div>

 <div className="pt-4 border-t border-[#2D2D2D]/50 flex justify-between items-center">
 <div className="h-3 bg-[#111] rounded-[4px] w-20"></div>
 <div className="flex gap-1.5">
 <div className="w-8 h-8 bg-[#111] rounded-[6px]"></div>
 <div className="w-8 h-8 bg-[#111] rounded-[6px]"></div>
 <div className="w-8 h-8 bg-[#111] rounded-[6px]"></div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default TurfCardSkeleton;