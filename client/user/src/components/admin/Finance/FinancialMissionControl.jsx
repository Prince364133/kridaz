import React, { useState } from "react";
import { 
  Landmark, CreditCard, ShieldCheck, Clock, CheckCircle, 
  XCircle, Filter, Download, ExternalLink, Calendar,
  TrendingUp, PieChart, Users, AlertCircle, Settings
} from "lucide-react";
import useAdminFinance from "../../../hooks/admin/useAdminFinance";

const FinancialMissionControl = () => {
  const { 
    payoutRequests, kycQueue, payoutSettings, stats, 
    loading, updatePayoutDay, verifyKYC, refresh 
  } = useAdminFinance();

  const [activeTab, setActiveTab] = useState("PAYOUTS");

  if (loading) return <div className="p-20 text-center text-gray-500 animate-pulse uppercase font-black tracking-widest">Accessing Financial Core...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10 space-y-8 pb-32">
      {/* Treasury Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase flex items-center gap-4">
              <Landmark className="text-[#84CC16]" size={44} />
              Financial <span className="text-white/50">Mission Control</span>
           </h1>
           <p className="text-gray-400 text-xs mt-2 font-bold uppercase tracking-[0.4em]">Global Treasury & Settlement Hub</p>
        </div>

        <div className="flex gap-4">
           <div className="bg-[#111] border border-white/10 px-6 py-3 rounded-2xl">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Treasury Balance</p>
              <p className="text-xl font-black text-white">₹ {stats?.totalRevenue?.toLocaleString()}</p>
           </div>
           <div className="bg-[#111] border border-white/10 px-6 py-3 rounded-2xl border-l-[#84CC16] border-l-2">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Total Payouts</p>
              <p className="text-xl font-black text-[#84CC16]">₹ {stats?.totalPayouts?.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Sidebar: Config & Stats */}
         <div className="space-y-6">
            <div className="bg-[#111] border border-white/10 rounded-[32px] p-6 space-y-6">
               <div className="flex items-center gap-2 mb-2">
                  <Settings size={16} className="text-[#84CC16]" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Payout Config</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Settlement Day</label>
                     <select 
                       value={payoutSettings?.payoutDay}
                       onChange={(e) => updatePayoutDay(parseInt(e.target.value))}
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#84CC16]"
                     >
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                     </select>
                  </div>
                  <div className="p-4 bg-[#84CC16]/5 border border-[#84CC16]/20 rounded-2xl">
                     <p className="text-[9px] text-[#84CC16] font-bold uppercase leading-relaxed">
                        Next automated window will open on {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][payoutSettings?.payoutDay]}. Settlement within 48hrs.
                     </p>
                  </div>
               </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-[32px] p-6">
               <h3 className="text-sm font-black uppercase tracking-widest mb-6">Marketplace Health</h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Pending KYC</p>
                        <p className="text-2xl font-black">{kycQueue.length}</p>
                     </div>
                     <Users size={20} className="text-gray-700" />
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-[#84CC16]" style={{ width: '40%' }} />
                  </div>
               </div>
            </div>
         </div>

         {/* Main Content: Queues */}
         <div className="lg:col-span-3 space-y-8">
            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-[#111] border border-white/10 rounded-2xl w-max">
               <button 
                 onClick={() => setActiveTab("PAYOUTS")}
                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "PAYOUTS" ? "bg-[#84CC16] text-black shadow-lg" : "text-gray-500 hover:text-white"}`}
               >
                  Payout Requests ({payoutRequests.filter(r => r.status === 'PENDING').length})
               </button>
               <button 
                 onClick={() => setActiveTab("KYC")}
                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "KYC" ? "bg-[#84CC16] text-black shadow-lg" : "text-gray-500 hover:text-white"}`}
               >
                  KYC Verification ({kycQueue.length})
               </button>
            </div>

            {/* List Container */}
            <div className="bg-[#111] border border-white/10 rounded-[32px] overflow-hidden min-h-[500px]">
               {activeTab === "PAYOUTS" ? (
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-white/[0.02] border-b border-white/5">
                          <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Partner Details</th>
                          <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Requested Coins</th>
                          <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {payoutRequests.length === 0 ? (
                         <tr>
                            <td colSpan="3" className="px-8 py-20 text-center text-gray-600 font-bold uppercase tracking-widest">No pending payout requests</td>
                         </tr>
                       ) : (
                         payoutRequests.map(req => (
                           <tr key={req._id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#84CC16]/10 flex items-center justify-center text-[#84CC16] border border-[#84CC16]/20 font-black">
                                       {req.owner?.name?.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="text-sm font-black">{req.owner?.name}</p>
                                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{req.owner?.role} • {req.owner?.email}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-lg font-black text-white">₹ {req.amount?.toLocaleString()}</p>
                                 <p className="text-[10px] text-[#84CC16] font-bold uppercase tracking-widest">Ready for Transfer</p>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center justify-center gap-3">
                                    <button className="px-4 py-2 bg-[#84CC16] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">Process</button>
                                    <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Reject</button>
                                 </div>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
               ) : (
                 <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {kycQueue.length === 0 ? (
                      <div className="col-span-full py-20 text-center text-gray-600 font-bold uppercase tracking-widest">KYC queue is currently empty</div>
                    ) : (
                      kycQueue.map(owner => (
                        <div key={owner._id} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 group hover:border-[#84CC16]/40 transition-all">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#84CC16]">
                                    <ShieldCheck size={24} />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-sm uppercase">{owner.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{owner.role}</p>
                                 </div>
                              </div>
                              <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase tracking-widest rounded-lg">Verification Pending</span>
                           </div>

                           <div className="grid grid-cols-2 gap-4 text-[10px]">
                              <div>
                                 <p className="text-gray-500 font-black uppercase tracking-widest mb-1">Bank Name</p>
                                 <p className="font-bold">{owner.bankingDetails?.bankName}</p>
                              </div>
                              <div>
                                 <p className="text-gray-500 font-black uppercase tracking-widest mb-1">A/C Number</p>
                                 <p className="font-bold">•••• {owner.bankingDetails?.accountNumber?.slice(-4)}</p>
                              </div>
                           </div>

                           <div className="flex gap-3">
                              <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                 <ExternalLink size={14} /> View Doc
                              </button>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => verifyKYC(owner._id, "VERIFIED")}
                                   className="w-12 h-12 bg-[#84CC16] text-black rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                                 >
                                    <CheckCircle size={20} />
                                 </button>
                                 <button 
                                   onClick={() => verifyKYC(owner._id, "REJECTED")}
                                   className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform"
                                 >
                                    <XCircle size={20} />
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default FinancialMissionControl;
