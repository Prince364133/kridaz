import React, { useState } from "react";
import { ShieldAlert, Info, CheckCircle, XCircle, Search, Filter, ArrowUpRight, User, Building } from "lucide-react";
import useDisputes from "../../../hooks/admin/useDisputes";

const DisputeManager = () => {
  const { disputes, loading, processingId, handleResolve } = useDisputes();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = 
      dispute.booking?.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.booking?.turfId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === "ALL" || dispute.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
              Dispute <span className="text-orange-500">Manager</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium tracking-wide">Investigate and resolve booking conflicts</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  type="text"
                  placeholder="Search disputes..."
                  className="bg-[#111] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full sm:w-64 focus:outline-none focus:border-orange-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
               className="bg-[#111] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
             >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
             </select>
          </div>
        </div>

        {/* Dispute Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {loading ? (
             <div className="col-span-full py-20 text-center text-gray-500 animate-pulse">Loading disputes...</div>
           ) : filteredDisputes.length === 0 ? (
             <div className="col-span-full py-20 text-center text-gray-500">No disputes found</div>
           ) : (
             filteredDisputes.map(dispute => (
               <div key={dispute._id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all group">
                  <div className="p-5 border-b border-white/5 flex justify-between items-center">
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                        dispute.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' :
                        dispute.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-orange-500/10 text-orange-500'
                     }`}>
                        {dispute.status}
                     </span>
                     <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(dispute.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="p-5 space-y-4">
                     <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Reason</p>
                        <h3 className="font-bold text-white text-lg leading-tight">{dispute.reason}</h3>
                     </div>

                     <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div>
                           <p className="text-[9px] text-gray-500 uppercase font-black mb-1 flex items-center gap-1"><User size={10}/> Reported By</p>
                           <p className="text-xs font-bold truncate">{dispute.raisedBy?.name}</p>
                           <p className="text-[10px] text-gray-500">{dispute.onModel}</p>
                        </div>
                        <div>
                           <p className="text-[9px] text-gray-500 uppercase font-black mb-1 flex items-center gap-1"><Building size={10}/> Venue</p>
                           <p className="text-xs font-bold truncate">{dispute.booking?.turfId?.name}</p>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-white/10 pl-3">
                           "{dispute.description}"
                        </p>
                     </div>

                     <div className="pt-4 border-t border-white/5 flex gap-2">
                        {dispute.status !== 'RESOLVED' ? (
                          <>
                             <button 
                               onClick={() => {
                                 const action = prompt("Resolution Action (REFUND, PAYOUT, NO_ACTION):");
                                 const message = prompt("Final Message:");
                                 if(action && message) handleResolve(dispute._id, action, message);
                               }}
                               className="flex-1 bg-orange-500 text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_5px_15px_rgba(249,115,22,0.2)]"
                             >
                                Resolve
                             </button>
                             <button className="bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl transition-all border border-white/10">
                                <ArrowUpRight size={18} />
                             </button>
                          </>
                        ) : (
                          <div className="w-full bg-green-500/5 border border-green-500/20 p-3 rounded-xl">
                             <p className="text-[9px] text-green-500 uppercase font-black mb-1 flex items-center gap-1"><CheckCircle size={10}/> Resolved</p>
                             <p className="text-[11px] text-gray-400">Action: <span className="text-white font-bold">{dispute.resolution?.action}</span></p>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default DisputeManager;
