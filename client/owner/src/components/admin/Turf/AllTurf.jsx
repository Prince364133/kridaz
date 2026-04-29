import { PackageOpen, Activity } from "lucide-react";
import useTurfData from "@hooks/admin/useTurf";
import Turf from "./Turf";
import TurfSkeleton from "./TurfSkeleton";

export const AllTurf = () => {
  const { turfData, loading } = useTurfData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <TurfSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Telemetry Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary font-mono text-[10px] uppercase tracking-[0.4em]">
             <Activity size={14} className="animate-pulse" />
             <span>System Layer: Arena Infrastructure</span>
          </div>
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-display font-black italic tracking-tighter leading-none uppercase text-white">
              Global <span className="text-primary">Arenas</span>
            </h1>
            <p className="font-mono text-gray-500 text-sm tracking-[0.4em] uppercase mt-4">Platform Arena Infrastructure & Status</p>
          </div>
        </div>

        {!turfData || turfData.length === 0 ? (
          <div className="relative p-12 notched-corner border border-white/5 bg-[#111111] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px]"></div>
            <div className="relative space-y-4">
               <PackageOpen size={64} className="mx-auto text-gray-700" />
               <p className="font-display font-black italic text-2xl uppercase tracking-wider text-gray-400">No Arenas Detected</p>
               <p className="font-mono text-xs text-gray-600 uppercase tracking-widest">No arena data retrieved from the supreme nexus.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfData.map((turf) => (
              <Turf key={turf._id} turf={turf} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTurf;
