import { PackageOpen, Activity } from "lucide-react";
import useTurfData from "@hooks/admin/useTurf";
import Turf from "./Turf";
import TurfSkeleton from "./TurfSkeleton";

export const AllTurf = () => {
  const { turfData, loading, approveTurf, rejectTurf } = useTurfData();

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
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#84CC16] font-bold text-xs uppercase tracking-widest">
             <Activity size={14} className="animate-pulse" />
             <span>Venue Management</span>
          </div>
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-white">
              Platform <span className="text-[#84CC16]">Venues</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">Manage and monitor all platform venues</p>
          </div>
        </div>

        {!turfData || turfData.length === 0 ? (
          <div className="relative p-12 rounded-2xl border border-white/10 bg-[#111] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[#84CC16]/5 blur-[100px]"></div>
            <div className="relative space-y-4">
               <PackageOpen size={64} className="mx-auto text-gray-700" />
               <p className="font-bold text-2xl text-gray-400">No Venues Found</p>
               <p className="text-sm text-gray-500">No venue data retrieved from the database.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfData.map((turf) => (
              <Turf 
                key={turf._id} 
                turf={turf} 
                onApprove={approveTurf}
                onReject={rejectTurf}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTurf;
