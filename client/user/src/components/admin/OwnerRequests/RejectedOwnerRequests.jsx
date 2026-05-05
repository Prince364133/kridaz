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
      <div className="space-y-12">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-red-500">
            Rejected <span className="text-[#84CC16]">Requests</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Denied Owner Authorizations</p>
        </div>

        <div className="space-y-8">
          <OwnerRequestSearch
            searchTerm={searchTerm}
            handleSearch={handleSearch}
          />
          
          {rejectedRequests.length === 0 ? (
            <div className="relative p-12 rounded-2xl border border-white/10 bg-[#111] text-center overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 blur-[100px]"></div>
               <div className="relative space-y-4">
                  <p className="font-bold text-2xl text-gray-400">No Rejected Requests</p>
                  <p className="text-sm text-gray-500">There are no denied recruitment requests.</p>
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
