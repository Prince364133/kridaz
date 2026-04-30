import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import useTurfManagement from "@hooks/owner/useTurfManagement";
import EditTurfForm from "./EditTurfForm";
import TurfCardSkeleton from "./TurfCardSkeleton";
import TurfCard from "./TurfCard";

const TurfManagement = () => {
  const { turfs, isLoading, error, fetchTurfs, editTurf } = useTurfManagement();
  const [editingTurf, setEditingTurf] = useState(null);

  useEffect(() => {
    fetchTurfs();
  }, []);

  const handleEdit = (turf) => {
    setEditingTurf(turf);
  };

  const handleSaveEdit = (updatedTurf, turfId) => {
    editTurf(updatedTurf, turfId);
    setEditingTurf(null);
  };

  const handleCancelEdit = () => {
    setEditingTurf(null);
  };

  if (error) {
    return <div className="text-error text-center mt-8">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="border-l-8 border-primary pl-6">
            <h1 className="text-4xl md:text-6xl font-display font-black italic tracking-tight text-white uppercase">
              ARENA <span className="text-primary">MANAGEMENT</span>
            </h1>
            <p className="text-gray-500 font-secondary uppercase tracking-widest mt-2">
              Inventory Control | BookMySportz
            </p>
          </div>
          
          <Link 
            to="/partner/add-turf"
            className="flex items-center gap-2 px-8 py-4 bg-primary text-black font-black uppercase tracking-tighter hover:bg-white hover:scale-105 transition-all duration-300 rounded-xl shadow-[4px_4px_0px_#fff] hover:shadow-none active:translate-y-1"
          >
            <Plus size={20} strokeWidth={3} />
            Add New Venue
          </Link>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="w-full">
                <TurfCardSkeleton />
              </div>
            ))}
          </div>
        ) : turfs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {turfs.map((turf) => (
              <div key={turf._id} className="w-full">
                {editingTurf && editingTurf._id === turf._id ? (
                  <div className="bg-[#111] border border-primary p-6 rounded-xl shadow-2xl">
                    <EditTurfForm
                      turf={editingTurf}
                      onSave={handleSaveEdit}
                      onCancel={handleCancelEdit}
                      turfId={turf._id}
                    />
                  </div>
                ) : (
                  <TurfCard turf={turf} onEdit={() => handleEdit(turf)} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#111] rounded-xl border border-dashed border-gray-800">
            <p className="text-gray-500 font-secondary uppercase tracking-widest">
              No active arenas found in your roster.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurfManagement;
