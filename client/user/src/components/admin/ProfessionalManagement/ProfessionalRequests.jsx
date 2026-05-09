import React from "react";
import { UserPlus, Search, Clock, CheckCircle, XCircle } from "lucide-react";
import useProfessionalRequests from "../../../hooks/admin/useProfessionalRequests";

const ProfessionalRequests = () => {
  const { requests, loading, handleAccept, handleReject, requestId, searchTerm, handleSearch } = useProfessionalRequests();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="absolute -left-4 top-0 w-1 h-12 bg-[#84CC16] rounded-full shadow-[0_0_15px_rgba(132,204,22,0.5)]"></div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
              Verification <span className="text-[#84CC16]">Queue</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">Coach & Umpire Onboarding Review</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#84CC16] transition-colors"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84CC16]"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="relative p-12 rounded-2xl border border-white/10 bg-[#111] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[#84CC16]/5 blur-[100px]"></div>
            <div className="relative space-y-4">
              <div className="mx-auto w-16 h-16 bg-[#84CC16]/10 text-[#84CC16] rounded-full flex items-center justify-center">
                <Clock size={32} />
              </div>
              <p className="font-bold text-2xl text-gray-400">Queue Clear</p>
              <p className="text-sm text-gray-500 max-w-lg mx-auto">
                There are no pending professional verification requests at the moment.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div key={request._id} className="bg-[#111] border border-white/10 rounded-xl p-6 hover:border-[#84CC16]/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">{request.name}</h3>
                    <p className="text-[#84CC16] text-xs font-bold uppercase tracking-wider">{request.role}</p>
                  </div>
                  <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold tracking-wider">
                    PENDING
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-sm text-gray-400">
                  <p><strong className="text-gray-300">Email:</strong> {request.email}</p>
                  <p><strong className="text-gray-300">Phone:</strong> {request.phone}</p>
                  {request.businessDetails?.experience && (
                    <p><strong className="text-gray-300">Experience:</strong> {request.businessDetails.experience}</p>
                  )}
                  {request.businessDetails?.specialization && (
                    <p><strong className="text-gray-300">Specialization:</strong> {request.businessDetails.specialization}</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
                  <button
                    onClick={() => handleAccept(request._id)}
                    disabled={requestId === request._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#84CC16]/10 text-[#84CC16] hover:bg-[#84CC16] hover:text-black rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                    disabled={requestId === request._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalRequests;
