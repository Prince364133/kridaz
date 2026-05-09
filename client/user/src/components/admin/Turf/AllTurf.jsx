import React, { useState } from "react";
import { PackageOpen, Activity } from "lucide-react";
import toast from "react-hot-toast";
import useTurfData from "@hooks/admin/useTurf";
import Turf from "./Turf";
import TurfSkeleton from "./TurfSkeleton";
import VenueDetailsModal from "./VenueDetailsModal";
import ConfirmationPopup from "./ConfirmationPopup";

export const AllTurf = () => {
  const { turfData, loading, approveTurf, rejectTurf } = useTurfData();
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", turfId: null, name: "" });

  const handleViewDetails = (turf) => {
    setSelectedTurf(turf);
    setIsDetailsOpen(true);
  };

  const openApproveConfirm = (id, name) => {
    setConfirmModal({ isOpen: true, type: "approve", turfId: id, name });
  };

  const openRejectConfirm = (id, name) => {
    setConfirmModal({ isOpen: true, type: "reject", turfId: id, name });
  };

  const processApprove = async (adminData) => {
    const success = await approveTurf(confirmModal.turfId, adminData);
    if (success) {
      toast.success(`Venue Approved by ${adminData.name} (${adminData.designation})`);
      setIsDetailsOpen(false);
    } else {
      toast.error("Operation Failed");
    }
  };

  const processReject = async (adminData) => {
    const success = await rejectTurf(confirmModal.turfId, adminData);
    if (success) {
      toast.success(`Venue Rejected by ${adminData.name}`);
      setIsDetailsOpen(false);
    } else {
      toast.error("Operation Failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <TurfSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10 relative">
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[#CCFF00] font-bold text-xs uppercase tracking-widest">
             <Activity size={14} className="animate-pulse" />
             <span>Venue Management</span>
          </div>
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white leading-none">
              Platform <span className="text-[#CCFF00]">Venues</span>
            </h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-3">Manage and monitor all platform venues</p>
          </div>
        </div>

        {!turfData || turfData.length === 0 ? (
          <div className="relative p-20 rounded-[32px] border border-white/5 bg-white/[0.02] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[#CCFF00]/5 blur-[100px]"></div>
            <div className="relative space-y-6">
               <PackageOpen size={80} className="mx-auto text-gray-800" />
               <div className="space-y-2">
                 <p className="font-black text-3xl text-white uppercase tracking-tighter">Silence in the Arena</p>
                 <p className="text-sm text-gray-500 max-w-md mx-auto">No venue data retrieved. The marketplace is currently clear of pending applications.</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {turfData.map((turf) => (
              <Turf 
                key={turf._id} 
                turf={turf} 
                onApprove={() => openApproveConfirm(turf._id, turf.name)}
                onReject={() => openRejectConfirm(turf._id, turf.name)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <VenueDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        turf={selectedTurf}
        onApprove={() => openApproveConfirm(selectedTurf?._id, selectedTurf?.name)}
        onReject={() => openRejectConfirm(selectedTurf?._id, selectedTurf?.name)}
      />

      <ConfirmationPopup 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.type === 'approve' ? processApprove : processReject}
        title={confirmModal.type === 'approve' ? 'Verify Venue' : 'Decline Venue'}
        message={`Are you sure you want to ${confirmModal.type} "${confirmModal.name}"? This action will update the marketplace status immediately.`}
        type={confirmModal.type === 'approve' ? 'success' : 'danger'}
        confirmText={confirmModal.type === 'approve' ? 'Verify & Approve' : 'Decline Venue'}
        showGovernanceForm={true}
      />
    </div>
  );
};

export default AllTurf;
