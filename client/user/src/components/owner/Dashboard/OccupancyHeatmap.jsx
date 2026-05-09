import React, { useState, useEffect } from 'react';
import { Clock, User, Phone, Mail, MapPin, X } from 'lucide-react';
import axiosInstance from '@hooks/useAxiosInstance';

const OccupancyHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axiosInstance.get('/api/owner/dashboard/occupancy');
      if (res.data.success) {
        setData(res.data.heatmap);
      }
    } catch (error) {
      console.error("Error fetching occupancy:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotColor = (count) => {
    if (count === 0) return 'rgba(45, 45, 45, 0.3)';
    const intensity = Math.min(1, count / 5); // Assuming 5+ is "peak"
    return `rgba(204, 255, 0, ${0.2 + intensity * 0.8})`;
  };

  return (
    <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider">Weekly Occupancy Calendar</h2>
          <p className="text-[10px] font-normal text-[#878C9F] uppercase tracking-widest mt-1">Real-time weekly booking density</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[2px] bg-[#2D2D2D]" />
            <span className="text-[10px] text-[#999999] font-medium uppercase tracking-wider">Empty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-[2px] bg-[#CCFF00]" />
            <span className="text-[10px] text-[#999999] font-medium uppercase tracking-wider">Booked</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar pt-4">
        <div className="min-w-[700px] space-y-2">
          {/* Hours Header */}
          <div className="flex gap-1 mb-4 ml-10">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex-1 text-center text-[7px] font-medium text-[#999999] uppercase tracking-tighter">
                {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
              </div>
            ))}
          </div>
          
          {/* Days Rows */}
          {days.map((day, dIdx) => (
            <div key={day} className="flex items-center gap-1">
              <div className="w-10 text-[10px] font-medium text-[#878C9F] uppercase tracking-wider">{day}</div>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const slot = data.find(s => s.day === dIdx && s.hour === hour);
                  const count = slot?.count || 0;
                  return (
                    <div 
                      key={hour} 
                      onClick={() => setSelectedSlot(slot)}
                      className="flex-1 h-8 rounded-[2px] transition-all duration-300 hover:scale-110 cursor-pointer border border-white/5"
                      style={{ 
                        backgroundColor: getSlotColor(count),
                        boxShadow: count > 0 ? '0 0 10px rgba(204, 255, 0, 0.1)' : 'none'
                      }}
                      title={`${day}, ${hour}:00 - ${count} Bookings`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#151617] border border-[#2D2D2D] rounded-[12px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#2D2D2D] flex items-center justify-between bg-black/40">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">
                  {days[selectedSlot.day]} @ {selectedSlot.hour === 0 ? '12 AM' : selectedSlot.hour < 12 ? `${selectedSlot.hour} AM` : selectedSlot.hour === 12 ? '12 PM' : `${selectedSlot.hour-12} PM`}
                </h3>
                <p className="text-sm text-[#CCFF00] font-medium uppercase tracking-widest mt-1">
                  {selectedSlot.count} ACTIVE BOOKINGS
                </p>
              </div>
              <button 
                onClick={() => setSelectedSlot(null)}
                className="p-2 hover:bg-[#2D2D2D] rounded-full text-[#999999] hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 no-scrollbar">
              {selectedSlot.details.length > 0 ? (
                selectedSlot.details.map((b, idx) => (
                  <div key={idx} className="bg-[#000000] p-5 rounded-[8px] border border-[#2D2D2D] hover:border-[#CCFF00]/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[6px] bg-[#CCFF00] flex items-center justify-center text-black font-black text-lg">
                             {b.user[0]}
                          </div>
                          <div>
                             <h4 className="text-white font-bold uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{b.user}</h4>
                             <p className="text-[10px] text-[#999999] uppercase tracking-widest">{b.turf}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-[#878C9F] uppercase font-bold tracking-widest">Amount</p>
                          <p className="text-white font-black">₹{b.amount}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2D2D2D]">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[#999999]">
                             <Phone size={12} className="text-[#CCFF00]" />
                             <span className="text-[11px] font-medium">{b.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#999999]">
                             <Mail size={12} className="text-[#CCFF00]" />
                             <span className="text-[11px] font-medium truncate">{b.email || 'N/A'}</span>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[#999999]">
                             <Clock size={12} className="text-[#CCFF00]" />
                             <span className="text-[11px] font-medium">{b.time}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 flex flex-col items-center gap-4">
                   <div className="w-16 h-16 rounded-full bg-[#2D2D2D] flex items-center justify-center text-[#999999]">
                      <Clock size={32} />
                   </div>
                   <div>
                      <p className="text-white font-bold uppercase tracking-widest">No Bookings</p>
                      <p className="text-sm text-[#999999] mt-1">This slot is currently available for booking.</p>
                   </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-black/60 border-t border-[#2D2D2D]">
               <p className="text-[9px] text-[#878C9F] text-center uppercase tracking-[0.2em] font-medium">Vault Secure Booking Intelligence</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupancyHeatmap;
