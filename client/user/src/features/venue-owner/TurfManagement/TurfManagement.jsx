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
        <button onClick={() => window.location.reload()} className="mt-4 text-[#BFF367] text-xs uppercase font-bold border-b border-[#BFF367]">Try Again</button>
      </div>
    );
  }

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#BFF367]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#BFF367]/5 blur-[120px] pointer-events-none" />
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 xl:gap-6 relative z-10 border-b border-[#2D2D2D] pb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
             <h1 className="text-[22px] lg:text-[26px] xl:text-[32px] font-bold font-open-sans tracking-tight uppercase leading-none whitespace-nowrap">Inventory Management</h1>
          </div>
          <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">Control your multisport facility roster.</p>
        </div>

        <div className="flex items-center gap-2 xl:gap-4 shrink-0">
           <div className="bg-[#000000] px-3 py-2 rounded-[6px] border border-[#2D2D2D] flex items-center gap-2 shadow-[var(--shadow-2)] shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#BFF367] animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">{turfs.length} Active Arenas</span>
           </div>
           
           <Link 
            to="/venue-owner/add-turf"
            className="bg-[#BFF367] hover:bg-[#B3FF00] text-black px-4 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-[var(--shadow-2)] shrink-0 whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={3} className="shrink-0" />
            <span>Add New Venue</span>
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
              onEdit={() => navigate(`/venue-owner/edit-turf/${turf._id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-[#000000] border border-[#2D2D2D] rounded-[8px] border-dashed shadow-[var(--shadow-2)]">
          <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-6 text-[#2D2D2D]">
             <Plus size={32} />
          </div>
          <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px]">No active arenas found in your roster.</p>
          <Link to="/venue-owner/add-turf" className="mt-6 text-[#BFF367] text-[11px] font-bold uppercase tracking-widest border-b border-[#BFF367]/40 hover:border-[#BFF367] transition-all pb-1">Initialize First Venue</Link>
        </div>
      )}
      </div>
    </div>
  );
};

export default TurfManagement;

