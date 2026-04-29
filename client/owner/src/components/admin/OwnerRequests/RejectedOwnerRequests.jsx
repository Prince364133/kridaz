import React from "react";
import useOwnerRequests from "@hooks/admin/useOwnerRequests";
import OwnerRequestCard from "./OwnerRequestsCard";
import OwnerRequestsSkeleton from "./OwnerRequestSkeleton";
import OwnerRequestSearch from "./OwnerRequestSearch";

const RejectedOwnerRequests = () => {
  const {
    rejectedRequests,
    loading,
    handleReconsider,
    requestId,
    searchTerm,
    handleSearch,
  } = useOwnerRequests();

  if (loading) return <OwnerRequestsSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-20 bg-primary shadow-[0_0_15px_rgba(113,179,0,0.5)]"></div>
          <h1 className="text-6xl md:text-8xl font-display font-black italic tracking-tighter leading-none uppercase text-red-500">
            Rejected <span className="text-primary">Recruits</span>
          </h1>
          <p className="font-mono text-gray-500 text-sm tracking-[0.4em] uppercase mt-4">Denied Personnel & Access Rejections</p>
        </div>

        <div className="space-y-8">
          <OwnerRequestSearch
            searchTerm={searchTerm}
            handleSearch={handleSearch}
          />
          
          {rejectedRequests.length === 0 ? (
            <div className="relative p-12 notched-corner border border-white/5 bg-[#111111] text-center overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 blur-[100px]"></div>
               <div className="relative space-y-4">
                  <p className="font-display font-black italic text-2xl uppercase tracking-wider text-gray-400">No Rejected Units Found</p>
                  <p className="font-mono text-xs text-gray-600 uppercase tracking-widest">The archives show no denied recruitment requests.</p>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejectedRequests.map((request) => (
                <OwnerRequestCard
                  key={request._id}
                  request={request}
                  onReconsider={handleReconsider}
                  isProcessing={requestId === request._id}
                  isRejected={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RejectedOwnerRequests;
