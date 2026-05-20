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
        <button onClick={() => window.location.reload()} className="mt-4 text-[#55DEE8] text-xs uppercase font-bold border-b border-[#55DEE8]">Try Again</button>
      </div>
    );
  }

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#55DEE8]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#55DEE8]/5 blur-[120px] pointer-events-none" />
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10 border-b border-[#2D2D2D] pb-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-6 bg-[#55DEE8] rounded-full" />
             <h1 className="text-[28px] lg:text-[32px] font-bold font-open-sans tracking-tight uppercase leading-none">Inventory Management</h1>
          </div>
          <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">Control your multisport facility roster.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-[#000000] px-5 py-2.5 rounded-[8px] border border-[#2D2D2D] flex items-center gap-3 shadow-[var(--shadow-2)]">
              <div className="w-2 h-2 rounded-full bg-[#55DEE8] animate-pulse" />
              <span className="text-[12px] font-bold text-white uppercase tracking-widest">{turfs.length} Active Arenas</span>
           </div>
           
           <Link 
            to="/venue-owner/add-turf"
            className="bg-[#55DEE8] hover:bg-[#B3FF00] text-black px-8 py-3 rounded-[8px] text-[13px] font-bold uppercase tracking-widest flex items-center gap-3 transition-all shadow-[var(--shadow-2)]"
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
          <Link to="/venue-owner/add-turf" className="mt-6 text-[#55DEE8] text-[11px] font-bold uppercase tracking-widest border-b border-[#55DEE8]/40 hover:border-[#55DEE8] transition-all pb-1">Initialize First Venue</Link>
        </div>
      )}
      </div>
    </div>
  );
};

export default TurfManagement;

