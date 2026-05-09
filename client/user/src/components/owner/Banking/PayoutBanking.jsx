import React, { useState, useMemo } from "react";
import { 
  Coins, Landmark, CreditCard, ArrowUpRight, TrendingUp, 
  History, Calendar, ShieldCheck, Download, Plus, 
  FileText, Upload, CheckCircle, AlertCircle, Lock
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import useBanking from "../../../hooks/owner/useBanking";
import useOwnerDashboard from "../../../hooks/owner/useOwnerDashboard";
import toast from "react-hot-toast";

const PayoutBanking = () => {
  const { bankingDetails, payoutSettings, loading, isPayoutDay, updateBanking } = useBanking();
  const { dashboardData } = useOwnerDashboard();
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [password, setPassword] = useState("");
  const [bankForm, setBankForm] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    payoutMode: "BANK"
  });

  // Derived Analytics (Simulated logic for multi-series)
  const analyticsData = useMemo(() => {
    return [
      { name: 'Mon', coins: 400, lastWeek: 240 },
      { name: 'Tue', coins: 300, lastWeek: 139 },
      { name: 'Wed', coins: 200, lastWeek: 980 },
      { name: 'Thu', coins: 278, lastWeek: 390 },
      { name: 'Fri', coins: 189, lastWeek: 480 },
      { name: 'Sat', coins: 239, lastWeek: 380 },
      { name: 'Sun', coins: 349, lastWeek: 430 },
    ];
  }, []);

  const totalCoins = dashboardData?.totalRevenue || 0;

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const success = await updateBanking(bankForm);
    if (success) setIsEditingBank(false);
  };

  const handlePayoutRequest = () => {
    if (password === "password") { // Placeholder verification
       toast.success("Payout request submitted! Processing in 48h.");
       setShowVerifyModal(false);
       setPassword("");
    } else {
       toast.error("Incorrect password");
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Initializing Secure Banking...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 lg:p-10 space-y-8 pb-32">
      {/* Top Banner: Marketplace Wealth */}
      <div className="relative p-8 lg:p-12 bg-gradient-to-br from-[#111] to-[#050505] rounded-[32px] border border-white/10 overflow-hidden">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] -z-10" />
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#CCFF00]/10 rounded-2xl border border-[#CCFF00]/20 text-[#CCFF00]">
                     <Coins size={32} />
                  </div>
                  <div>
                     <h1 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase">Marketplace <span className="text-[#CCFF00]">Vault</span></h1>
                     <p className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-[0.4em]">Banking & Settlement Console</p>
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                     <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Available Coins</p>
                     <p className="text-2xl font-black text-white">{totalCoins.toLocaleString()} <span className="text-xs text-[#CCFF00] ml-1 uppercase">Coins</span></p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                     <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Lifetime Earnings</p>
                     <p className="text-2xl font-black text-white">{(totalCoins * 1.4).toFixed(0)}</p>
                  </div>
               </div>
            </div>

            {/* Payout Trigger Area */}
            <div className="w-full lg:w-auto">
               {isPayoutDay ? (
                 <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/30 p-6 rounded-[32px] space-y-4 shadow-[0_0_50px_rgba(204,255,0,0.1)]">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="text-[#CCFF00]" size={16} />
                       <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">Payout Window Active</span>
                    </div>
                    <h3 className="text-xl font-bold">Total Settlement: {dashboardData?.settlementRevenue || 0} Coins</h3>
                    <button 
                      onClick={() => setShowVerifyModal(true)}
                      className="w-full py-4 bg-[#CCFF00] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#b3ff00] transition-all shadow-[0_10px_30px_rgba(204,255,0,0.3)]"
                    >
                       Get Your Total Payout
                    </button>
                    <p className="text-[9px] text-gray-500 text-center font-bold uppercase">Settlement time: within next 48 hrs</p>
                 </div>
               ) : (
                 <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] space-y-4 opacity-60">
                    <div className="flex items-center gap-2">
                       <Lock className="text-gray-500" size={16} />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Next Payout: {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][payoutSettings?.payoutDay || 6]}</span>
                    </div>
                    <button disabled className="w-full py-4 bg-white/10 text-gray-500 rounded-2xl font-black uppercase tracking-[0.2em] text-xs cursor-not-allowed">
                       Payout Window Closed
                    </button>
                 </div>
               )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Multi-Series Analytics Graph */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#111] border border-white/10 rounded-[32px] p-8">
               <div className="flex justify-between items-center mb-10">
                  <div>
                     <h2 className="text-xl font-bold uppercase tracking-tight">Revenue Intelligence</h2>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Daily Coin Accrual vs Last Week</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#CCFF00]" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">This Week</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-white/20" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Last Week</span>
                     </div>
                  </div>
               </div>

               <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={analyticsData}>
                        <defs>
                           <linearGradient id="colorCoins" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#4B5563', fontSize: 10, fontWeight: 'bold'}}
                          dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#111', border: '1px solid #222', borderRadius: '16px'}}
                          itemStyle={{color: '#CCFF00', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10px'}}
                        />
                        <Area type="monotone" dataKey="lastWeek" stroke="#ffffff20" strokeWidth={2} fill="transparent" />
                        <Area type="monotone" dataKey="coins" stroke="#CCFF00" strokeWidth={3} fillOpacity={1} fill="url(#colorCoins)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-[#111] border border-white/10 rounded-[32px] overflow-hidden">
               <div className="p-8 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-lg font-bold uppercase tracking-tight">Financial Ledger</h3>
                  <button className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors">
                     Download CSV <Download size={14} />
                  </button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/[0.02]">
                           <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Transaction Details</th>
                           <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                           <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {[1,2,3,4,5].map(i => (
                          <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                      <TrendingUp size={16} className="text-[#CCFF00]" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold">Booking Settlement #BMS-{i}920</p>
                                      <p className="text-[10px] text-gray-500 font-medium">Turf Booking • Pre-paid</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5 text-xs text-gray-400 font-medium">May 0{i}, 2026</td>
                             <td className="px-8 py-5 text-right font-black text-[#CCFF00]">+ {(Math.random() * 1000).toFixed(0)} Coins</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right Sidebar: Banking & KYC */}
         <div className="space-y-8">
            {/* Banking Details Card */}
            <div className="bg-[#111] border border-white/10 rounded-[32px] p-8 space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold uppercase tracking-tight">Banking Info</h3>
                  <button 
                    onClick={() => setIsEditingBank(!isEditingBank)}
                    className="p-2 bg-white/5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"
                  >
                     <Plus size={16} />
                  </button>
               </div>

               {isEditingBank ? (
                 <form onSubmit={handleBankSubmit} className="space-y-4 animate-in slide-in-from-top duration-300">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Account Name</label>
                       <input 
                         type="text" required
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00]"
                         value={bankForm.accountName}
                         onChange={e => setBankForm({...bankForm, accountName: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Account #</label>
                          <input 
                            type="text" required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00]"
                            value={bankForm.accountNumber}
                            onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">IFSC Code</label>
                          <input 
                            type="text" required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00]"
                            value={bankForm.ifscCode}
                            onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Payout Mode</label>
                       <select 
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none"
                         value={bankForm.payoutMode}
                         onChange={e => setBankForm({...bankForm, payoutMode: e.target.value})}
                       >
                          <option value="BANK">Bank Transfer</option>
                          <option value="UPI">UPI</option>
                       </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-[#CCFF00] text-black font-black uppercase text-[10px] tracking-widest rounded-xl mt-4">Save & Verify</button>
                 </form>
               ) : (
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                       <div className="w-12 h-12 bg-[#CCFF00]/10 rounded-2xl flex items-center justify-center text-[#CCFF00]">
                          <Landmark size={24} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-white">{bankingDetails?.bankName || "HDFC Bank"}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ending in •••• {bankingDetails?.accountNumber?.slice(-4) || "4920"}</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-gray-500 uppercase tracking-widest">Account Name</span>
                          <span className="text-white uppercase tracking-wider">{bankingDetails?.accountName || "PRASENJIT DAS"}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-gray-500 uppercase tracking-widest">IFSC Code</span>
                          <span className="text-white uppercase tracking-wider">{bankingDetails?.ifscCode || "HDFC0001234"}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-gray-500 uppercase tracking-widest">Payout Mode</span>
                          <span className="text-[#CCFF00] uppercase tracking-wider bg-[#CCFF00]/10 px-2 py-0.5 rounded-full">{bankingDetails?.payoutMode || "Bank"}</span>
                       </div>
                    </div>

                    {/* KYC Indicator */}
                    <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl space-y-2">
                       <div className="flex items-center gap-2">
                          <AlertCircle className="text-orange-500" size={14} />
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">KYC Pending</span>
                       </div>
                       <p className="text-[10px] text-gray-500 font-medium">Please upload your cancelled check image to verify your bank account.</p>
                       <button className="w-full py-2.5 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                          <Upload size={14} /> Upload Check
                       </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Payout History Snapshot */}
            <div className="bg-[#111] border border-white/10 rounded-[32px] p-8">
               <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Recent Settlements</h3>
               <div className="space-y-4">
                  {[1,2].map(i => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                             <CheckCircle size={14} />
                          </div>
                          <div>
                             <p className="text-xs font-bold">₹ 12,400.00</p>
                             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Apr 2{i}, 2026</p>
                          </div>
                       </div>
                       <button className="text-[9px] font-black text-[#CCFF00] uppercase tracking-widest flex items-center gap-1">
                          Report <Download size={10} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowVerifyModal(false)} />
           <div className="relative bg-[#111] border border-white/10 w-full max-w-md rounded-[32px] p-8 space-y-8 animate-in zoom-in duration-300">
              <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-[#CCFF00]/10 rounded-full flex items-center justify-center text-[#CCFF00] mx-auto mb-4 border border-[#CCFF00]/20">
                    <Lock size={32} />
                 </div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Secure Payout</h2>
                 <p className="text-xs text-gray-500 font-medium">Verify your identity to initiate settlement</p>
              </div>

              <div className="space-y-4">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Estimated Payout</p>
                    <p className="text-xl font-bold">₹ {totalCoins.toLocaleString()}</p>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Account Password</label>
                    <input 
                      type="password"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:border-[#CCFF00]"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                 </div>

                 <button 
                   onClick={handlePayoutRequest}
                   className="w-full py-4 bg-[#CCFF00] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
                 >
                    Confirm Settlement
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PayoutBanking;
