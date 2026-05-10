import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Phone, MapPin, IndianRupee, Search, ChevronRight } from "lucide-react";
import useProfessionals from "../../../hooks/admin/useProfessionals";

const ProfessionalManagement = ({ role }) => {
  const { 
    professionals, 
    loading, 
    searchTerm, 
    handleSearch 
  } = useProfessionals(role);

  const navigate = useNavigate();

  const handleCardClick = (id) => {
    navigate(`/admin/professionals/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="absolute -left-4 top-0 w-1 h-12 bg-[#84CC16] rounded-full shadow-[0_0_15px_rgba(132,204,22,0.5)]"></div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
              Manage <span className="text-[#84CC16]">{role === "coach" ? "Coaches" : "Umpires"}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">Active Professional Roster</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${role}s by name or email...`}
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
        ) : professionals.length === 0 ? (
          <div className="relative p-12 rounded-2xl border border-white/10 bg-[#111] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[#84CC16]/5 blur-[100px]"></div>
            <div className="relative space-y-4">
              <div className="mx-auto w-16 h-16 bg-[#84CC16]/10 text-[#84CC16] rounded-full flex items-center justify-center">
                <Shield size={32} />
              </div>
              <p className="font-bold text-2xl text-gray-400">No {role}s Found</p>
              <p className="text-sm text-gray-500 max-w-lg mx-auto">
                There are no active {role}s in the system currently.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {professionals.map((prof) => (
              <div 
                key={prof._id} 
                onClick={() => handleCardClick(prof._id)}
                className="bg-[#111] border border-white/10 rounded-xl p-6 hover:border-[#84CC16]/50 hover:bg-[#84CC16]/5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
              >
                {/* Glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#84CC16]/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#84CC16]/10 flex items-center justify-center text-[#84CC16] font-bold text-xl uppercase border border-[#84CC16]/20">
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-[#84CC16] transition-colors">{prof.name}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{prof.role}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-[#84CC16]/10 text-[#84CC16] rounded-full text-xs font-bold tracking-wider">
                    ACTIVE
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Mail size={16} className="text-gray-500" />
                    <span>{prof.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Phone size={16} className="text-gray-500" />
                    <span>{prof.phone || "Not provided"}</span>
                  </div>
                  {prof.businessDetails?.experience && (
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <Shield size={16} className="text-gray-500" />
                      <span>Experience: {prof.businessDetails.experience}</span>
                    </div>
                  )}
                  {prof.price > 0 && (
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <IndianRupee size={16} className="text-gray-500" />
                      <span>Rate: Rs {prof.price} / session</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Bookings</p>
                    <p className="font-bold text-white">{prof.bookingCount || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Rating</p>
                    <p className="font-bold text-white">{prof.rating || "N/A"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Wallet</p>
                    <p className="font-bold text-[#84CC16]">Rs {prof.walletBalance || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalManagement;
