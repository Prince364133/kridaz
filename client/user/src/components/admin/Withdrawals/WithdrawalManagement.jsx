import React, { useState } from "react";
import { IndianRupee, Clock, CheckCircle, XCircle, Search, Building, User, Mail, CreditCard, ExternalLink } from "lucide-react";
import useWithdrawals from "../../../hooks/admin/useWithdrawals";

const WithdrawalManagement = () => {
  const { requests, loading, processingId, handleApprove, handleReject } = useWithdrawals();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, COMPLETED, REJECTED

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.bankDetails?.accountNumber?.includes(searchTerm);
    
    const matchesFilter = filter === "ALL" || req.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "text-yellow-500 bg-yellow-500/10";
      case "COMPLETED": return "text-green-500 bg-green-500/10";
      case "REJECTED": return "text-red-500 bg-red-500/10";
      case "PROCESSING": return "text-blue-500 bg-blue-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="absolute -left-4 top-0 w-1 h-12 bg-[#84CC16] rounded-full shadow-[0_0_15px_rgba(132,204,22,0.5)]"></div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
              Payout <span className="text-[#84CC16]">Withdrawals</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">Manage partner earnings and bank transfers</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  type="text"
                  placeholder="Search by owner or account..."
                  className="bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full sm:w-64 focus:outline-none focus:border-[#84CC16] transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
               className="bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#84CC16] transition-colors"
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
             >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
             </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <div className="bg-[#111] border border-white/5 p-6 rounded-xl">
              <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Total Pending</p>
              <p className="text-2xl font-bold text-yellow-500">
                ₹{requests.filter(r => r.status === "PENDING").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </p>
           </div>
           <div className="bg-[#111] border border-white/5 p-6 rounded-xl">
              <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Processed (MTD)</p>
              <p className="text-2xl font-bold text-[#84CC16]">
                ₹{requests.filter(r => r.status === "COMPLETED").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </p>
           </div>
           <div className="bg-[#111] border border-white/5 p-6 rounded-xl">
              <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Pending Requests</p>
              <p className="text-2xl font-bold text-white">
                {requests.filter(r => r.status === "PENDING").length}
              </p>
           </div>
           <div className="bg-[#111] border border-white/5 p-6 rounded-xl">
              <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Avg. Payout</p>
              <p className="text-2xl font-bold text-white">
                ₹{requests.length > 0 ? Math.round(requests.reduce((acc, curr) => acc + curr.amount, 0) / requests.length).toLocaleString() : 0}
              </p>
           </div>
        </div>

        {/* List */}
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                       <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 tracking-wider">Partner</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 tracking-wider">Bank Details</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 tracking-wider">Amount</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 tracking-wider">Status</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 tracking-wider">Date</th>
                       <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 tracking-wider text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                           <div className="animate-spin h-8 w-8 border-2 border-[#84CC16] border-t-transparent rounded-full mx-auto mb-4"></div>
                           Fetching payout data...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                           No withdrawal requests matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-[#84CC16]/10 flex items-center justify-center text-[#84CC16] font-bold border border-[#84CC16]/20">
                                    {req.owner?.name?.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold text-white text-sm">{req.owner?.name}</p>
                                    <p className="text-gray-500 text-xs">{req.owner?.role}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-1">
                                 <p className="text-xs text-gray-300 flex items-center gap-1.5">
                                    <Building size={12} className="text-gray-500" /> {req.bankDetails?.bankName}
                                 </p>
                                 <p className="text-xs text-gray-400 font-mono tracking-tighter">
                                    {req.bankDetails?.accountNumber}
                                 </p>
                                 <p className="text-[10px] text-gray-500 uppercase">{req.bankDetails?.ifscCode}</p>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <p className="font-black text-white">₹{req.amount.toLocaleString()}</p>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                                 {req.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-xs text-gray-500">
                              {new Date(req.createdAt).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4 text-right">
                              {req.status === "PENDING" ? (
                                <div className="flex justify-end gap-2">
                                   <button 
                                     onClick={() => {
                                       const tid = prompt("Enter Transfer Transaction ID:");
                                       if(tid) handleApprove(req._id, tid);
                                     }}
                                     className="p-2 bg-[#84CC16]/10 text-[#84CC16] hover:bg-[#84CC16] hover:text-black rounded-lg transition-all"
                                     title="Approve & Process"
                                   >
                                      <CheckCircle size={18} />
                                   </button>
                                   <button 
                                     onClick={() => {
                                       const reason = prompt("Enter Rejection Reason:");
                                       if(reason) handleReject(req._id, reason);
                                     }}
                                     className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                     title="Reject Request"
                                   >
                                      <XCircle size={18} />
                                   </button>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">
                                   {req.status === "COMPLETED" ? `ID: ${req.transactionId || "N/A"}` : req.rejectionReason}
                                </div>
                              )}
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalManagement;
