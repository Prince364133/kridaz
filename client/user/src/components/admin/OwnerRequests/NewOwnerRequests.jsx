import React from "react";
import useOwnerRequests from "@hooks/admin/useOwnerRequests";
// import useOwnerRequests from "../../../hooks/admin/useOwnerRequests";
import OwnerRequestCard from "./OwnerRequestsCard";
import OwnerRequestsSkeleton from "./OwnerRequestSkeleton";
import OwnerRequestSearch from "./OwnerRequestSearch";

const NewOwnerRequests = () => {
  const {
    requests,
    loading,
    handleAccept,
    handleReject,
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
          <div className="absolute -left-4 top-0 w-1 h-12 bg-[#84CC16] rounded-full shadow-[0_0_15px_rgba(132,204,22,0.5)]"></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
            New <span className="text-[#84CC16]">Requests</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Venue Owner Authorization & Verification</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="w-full max-w-xl">
            <OwnerRequestSearch
              searchTerm={searchTerm}
              handleSearch={handleSearch}
            />
          </div>
          <div className="font-bold text-xs text-gray-500 uppercase tracking-widest hidden md:block">
            PENDING REQUESTS: {requests.length}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="relative p-12 rounded-2xl border border-white/10 bg-[#111] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[#84CC16]/5 blur-[100px]"></div>
            <div className="relative space-y-4">
               <p className="font-bold text-2xl text-gray-400">Queue Clear</p>
               <p className="text-sm text-gray-500">No pending authorization requests detected.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <OwnerRequestCard
                key={request._id}
                request={request}
                onAccept={handleAccept}
                onReject={handleReject}
                isProcessing={requestId === request._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOwnerRequests;
