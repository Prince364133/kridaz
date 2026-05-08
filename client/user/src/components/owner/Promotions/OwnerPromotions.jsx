import React, { useState } from "react";
import { 
  Tag, Plus, Calendar, Clock, Percent, 
  IndianRupee, CheckCircle2, XCircle, Search, Trash2 
} from "lucide-react";

export default function OwnerPromotions() {
  const [promotions, setPromotions] = useState([
    {
      id: 1,
      code: "SUMMER25",
      type: "percentage",
      value: 25,
      validUntil: "2026-08-31",
      status: "active",
      usageLimit: 100,
      usedCount: 45
    },
    {
      id: 2,
      code: "WEEKEND150",
      type: "flat",
      value: 150,
      validUntil: "2026-05-15",
      status: "active",
      usageLimit: 50,
      usedCount: 50
    },
    {
      id: 3,
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      validUntil: "2026-12-31",
      status: "inactive",
      usageLimit: null,
      usedCount: 120
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    type: "percentage",
    value: "",
    validUntil: "",
    usageLimit: ""
  });

  const handleCreatePromo = (e) => {
    e.preventDefault();
    const promo = {
      id: Date.now(),
      code: newPromo.code.toUpperCase(),
      type: newPromo.type,
      value: Number(newPromo.value),
      validUntil: newPromo.validUntil,
      status: "active",
      usageLimit: newPromo.usageLimit ? Number(newPromo.usageLimit) : null,
      usedCount: 0
    };
    setPromotions([promo, ...promotions]);
    setIsModalOpen(false);
    setNewPromo({ code: "", type: "percentage", value: "", validUntil: "", usageLimit: "" });
  };

  const deletePromo = (id) => {
    setPromotions(promotions.filter(p => p.id !== id));
  };

  const toggleStatus = (id) => {
    setPromotions(promotions.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === "active" ? "inactive" : "active" };
      }
      return p;
    }));
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white font-inter bg-[#050505] min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2D2D2D] pb-6">
        <div>
          <div className="flex items-center gap-3">
             <Tag className="text-[#CCFF00]" size={28} />
             <h1 className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">Promotion Engine</h1>
          </div>
          <p className="text-[#878C9F] text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Generate and monitor discount campaigns</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-[8px] text-sm font-bold transition-all shadow-[0_0_15px_rgba(204,255,0,0.15)]"
        >
          <Plus size={18} />
          Create Promotion
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <CheckCircle2 size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Active Campaigns</p>
          <h3 className="text-3xl font-bold font-outfit text-[#CCFF00]">
             {promotions.filter(p => p.status === "active").length}
          </h3>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <Tag size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Total Codes Issued</p>
          <h3 className="text-3xl font-bold font-outfit text-white">
             {promotions.length}
          </h3>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <Clock size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Redemptions</p>
          <h3 className="text-3xl font-bold font-outfit text-white">
             {promotions.reduce((acc, curr) => acc + curr.usedCount, 0)}
          </h3>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] overflow-hidden">
        <div className="p-4 border-b border-[#2D2D2D] flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878C9F]" size={16} />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full bg-[#1A1A1A] border border-[#2D2D2D] text-white pl-10 pr-4 py-2 rounded-[8px] text-sm focus:outline-none focus:border-[#CCFF00]/50 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] border-b border-[#2D2D2D]">
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Discount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Usage</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Validity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[#878C9F] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id} className="border-b border-[#2D2D2D] hover:bg-[#1A1A1A]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#2D2D2D] rounded-[4px] text-sm font-bold tracking-wider text-white">
                      {promo.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#CCFF00]">
                      {promo.type === 'percentage' ? <Percent size={14} /> : <IndianRupee size={14} />}
                      {promo.value}{promo.type === 'percentage' ? '%' : ' OFF'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-sm font-bold text-white">{promo.usedCount} <span className="text-[#878C9F] text-xs font-normal">redemptions</span></span>
                       {promo.usageLimit && (
                         <div className="w-24 h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${promo.usedCount >= promo.usageLimit ? 'bg-red-500' : 'bg-[#CCFF00]'}`} 
                              style={{ width: `${Math.min((promo.usedCount / promo.usageLimit) * 100, 100)}%` }} 
                            />
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[#878C9F]">
                       <Calendar size={14} />
                       {new Date(promo.validUntil).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(promo.id)}
                      className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-[4px] border transition-colors ${
                        promo.status === 'active' 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" 
                          : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                      }`}
                    >
                      {promo.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deletePromo(promo.id)}
                      className="p-2 text-[#878C9F] hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition-all"
                      title="Delete Campaign"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Tag size={32} className="text-[#333] mb-3" />
                      <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">No Active Campaigns</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111111] border border-[#2D2D2D] rounded-[16px] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#2D2D2D] flex justify-between items-center bg-[#1A1A1A]">
              <h2 className="text-lg font-bold font-outfit text-white flex items-center gap-2">
                <Tag size={18} className="text-[#CCFF00]" />
                Initialize Campaign
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[#878C9F] hover:text-white transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePromo} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Promo Code</label>
                <input 
                  type="text" 
                  required
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                  className="w-full bg-[#050505] border border-[#2D2D2D] text-white px-4 py-2.5 rounded-[8px] text-sm focus:outline-none focus:border-[#CCFF00]/50 uppercase"
                  placeholder="e.g. SUMMER25"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Type</label>
                  <select 
                    value={newPromo.type}
                    onChange={(e) => setNewPromo({...newPromo, type: e.target.value})}
                    className="w-full bg-[#050505] border border-[#2D2D2D] text-white px-4 py-2.5 rounded-[8px] text-sm focus:outline-none focus:border-[#CCFF00]/50"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Value</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({...newPromo, value: e.target.value})}
                    className="w-full bg-[#050505] border border-[#2D2D2D] text-white px-4 py-2.5 rounded-[8px] text-sm focus:outline-none focus:border-[#CCFF00]/50"
                    placeholder="e.g. 25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Valid Until</label>
                  <input 
                    type="date" 
                    required
                    value={newPromo.validUntil}
                    onChange={(e) => setNewPromo({...newPromo, validUntil: e.target.value})}
                    className="w-full bg-[#050505] border border-[#2D2D2D] text-[#878C9F] px-4 py-2.5 rounded-[8px] text-sm focus:outline-none focus:border-[#CCFF00]/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-2">Usage Limit (Opt)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={newPromo.usageLimit}
                    onChange={(e) => setNewPromo({...newPromo, usageLimit: e.target.value})}
                    className="w-full bg-[#050505] border border-[#2D2D2D] text-white px-4 py-2.5 rounded-[8px] text-sm focus:outline-none focus:border-[#CCFF00]/50"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#2D2D2D] flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-[#1A1A1A] border border-[#2D2D2D] text-white rounded-[8px] text-sm font-bold hover:bg-[#2D2D2D] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#CCFF00] text-black rounded-[8px] text-sm font-bold hover:bg-[#b3ff00] transition-colors shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                >
                  Deploy Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
