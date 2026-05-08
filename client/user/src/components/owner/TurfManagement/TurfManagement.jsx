import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import useTurfManagement from "@hooks/owner/useTurfManagement";
import TurfCardSkeleton from "./TurfCardSkeleton";
import TurfCard from "./TurfCard";

const TurfManagement = () => {
  const navigate = useNavigate();
  const { turfs, isLoading, error, fetchTurfs, deleteTurf, toggleVisibility } = useTurfManagement();

  useEffect(() => {
    fetchTurfs();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <p className="text-red-500 font-bold uppercase tracking-widest">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-[#CCFF00] text-xs uppercase font-bold border-b border-[#CCFF00]">Try Again</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8 font-inter space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-[#CCFF00] rounded-full" />
             <h1 className="text-2xl font-semibold uppercase tracking-tight text-white font-outfit">Inventory Management</h1>
          </div>
          <p className="text-[#878C9F] text-[10px] font-bold uppercase tracking-[3px] ml-4.5 opacity-60">Control your multisport facility roster.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-[#111111] px-5 py-2.5 rounded-[10px] border border-[#2D2D2D] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">{turfs.length} Active Arenas</span>
           </div>
           
           <Link 
            to="/partner/add-turf"
            className="bg-[#CCFF00] hover:bg-[#B3FF00] text-black px-8 py-3 rounded-[10px] text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all shadow-[0_8px_30px_rgba(204,255,0,0.15)]"
          >
            <Plus size={18} strokeWidth={3} />
            Add New Venue
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <TurfCardSkeleton key={index} />
          ))}
        </div>
      ) : turfs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {turfs.map((turf) => (
            <TurfCard 
              key={turf._id}
              turf={turf} 
              onDelete={() => deleteTurf(turf._id)}
              onToggleVisibility={() => toggleVisibility(turf._id)}
              onEdit={() => navigate(`/partner/edit-turf/${turf._id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-[#000000] border border-[#2D2D2D] rounded-[16px] border-dashed">
          <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-6 text-[#2D2D2D]">
             <Plus size={32} />
          </div>
          <p className="text-[#878C9F] text-[11px] font-bold uppercase tracking-[4px]">No active arenas found in your roster.</p>
          <Link to="/partner/add-turf" className="mt-6 text-[#CCFF00] text-[10px] font-bold uppercase tracking-widest border-b border-[#CCFF00]/40 hover:border-[#CCFF00] transition-all pb-1">Initialize First Venue</Link>
        </div>
      )}
    </div>
  );
};

export default TurfManagement;
