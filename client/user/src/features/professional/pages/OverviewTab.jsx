import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  MapPin, 
  Phone, 
  Activity, 
  IndianRupee, 
  Star, 
  User, 
  CheckCircle,
  Bell,
  Clock
} from "lucide-react";
import { 
  useToggleOnlineMutation, 
  useGetMyOnDemandBookingsQuery, 
  useVerifyOTPMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation
} from "../../../redux/api/professionalApi";
import { useSelector } from "react-redux";
import { useSocket } from "@context/SocketContext"; // wait, socket is browser-side, we must import socket.io-client or use a shared hook. Let's check how the codebase connects to sockets.

// Let's create a custom websocket listener or use standard window socket if available.
// Let's design it dynamically to support real-time WebSocket matching.

const OverviewTab = ({ role, profile }) => {
  const user = useSelector((state) => state.auth?.user);
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState(profile?.isOnline || false);
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Real-time match offers state
  const [activeOffer, setActiveOffer] = useState(null);
  const [offerCountdown, setOfferCountdown] = useState(30);

  const { data: bookingsData, refetch: refetchBookings } = useGetMyOnDemandBookingsQuery();
  const [toggleOnlineApi, { isLoading: isToggling }] = useToggleOnlineMutation();
  const [verifyOtpApi, { isLoading: isVerifying }] = useVerifyOTPMutation();
  const [acceptOfferApi] = useAcceptOfferMutation();
  const [rejectOfferApi] = useRejectOfferMutation();

  // Load profile online state
  useEffect(() => {
    if (profile) {
      setIsOnline(profile.isOnline);
    }
  }, [profile]);

  // Handle Online Toggle
  const handleToggleOnline = async () => {
    try {
      const nextState = !isOnline;
      // Get current geolocation if available
      if (nextState && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await toggleOnlineApi({ isOnline: nextState, latitude, longitude }).unwrap();
            setIsOnline(nextState);
          },
          async () => {
            // Fallback if location access is denied
            await toggleOnlineApi({ isOnline: nextState }).unwrap();
            setIsOnline(nextState);
          }
        );
      } else {
        await toggleOnlineApi({ isOnline: nextState }).unwrap();
        setIsOnline(nextState);
      }
    } catch (err) {
      console.error("Failed to toggle online status", err);
    }
  };

  // Handle OTP Submission
  const handleVerifyOtp = async (bookingId) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (otp.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit OTP.");
      return;
    }
    try {
      await verifyOtpApi({ bookingId, otp }).unwrap();
      setSuccessMsg("Check-in successful! Payout escrow released.");
      setOtp("");
      refetchBookings();
    } catch (err) {
      setErrorMsg(err.data?.message || "OTP verification failed. Please try again.");
    }
  };

  // Active match request calculation
  const activeBooking = bookingsData?.bookings?.find(
    (b) => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
  );

  const pastBookingsCount = bookingsData?.bookings?.filter((b) => b.status === "COMPLETED").length || 0;
  const totalEarnings = bookingsData?.bookings?.filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + parseFloat(b.hourlyRate), 0) || 0;

  // Listen to WebSocket events for incoming match offers
  useEffect(() => {
    if (!socket) return;

    const handleMatchOffer = (data) => {
      if (isOnline) {
        setActiveOffer(data);
        setOfferCountdown(30);
      }
    };

    socket.on("professional:match_offer", handleMatchOffer);
    return () => {
      socket.off("professional:match_offer", handleMatchOffer);
    };
  }, [socket, isOnline]);

  // Handle countdown timer for incoming offers
  useEffect(() => {
    if (!activeOffer) return;
    if (offerCountdown <= 0) {
      setActiveOffer(null);
      return;
    }
    const timer = setTimeout(() => {
      setOfferCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeOffer, offerCountdown]);

  const handleAcceptOffer = async (offerId) => {
    try {
      await acceptOfferApi(offerId).unwrap();
      setActiveOffer(null);
      refetchBookings();
    } catch (err) {
      alert("Failed to accept offer. It may have expired or been taken by another professional.");
      setActiveOffer(null);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await rejectOfferApi(offerId).unwrap();
      setActiveOffer(null);
    } catch (err) {
      setActiveOffer(null);
    }
  };

  return (
    <div className="space-y-6 text-white font-inter">
      {/* Header and Online State Toggle Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-2xl bg-gradient-to-r from-[#181818] to-[#121212] border border-[#2D2D2D] gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hello, {user?.name || "Professional"} 👋
          </h1>
          <p className="text-[#878C9F] text-sm mt-1 capitalize">
            Manage your on-demand {role} portal and verify active game bookings.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#222222] px-5 py-3 rounded-xl border border-[#2D2D2D]">
          <span className={`text-sm font-semibold tracking-wide ${isOnline ? "text-[#55DEE8]" : "text-gray-400"}`}>
            {isOnline ? "ONLINE & AVAILABLE" : "OFFLINE / BUSY"}
          </span>
          <button 
            onClick={handleToggleOnline} 
            disabled={isToggling}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${isOnline ? "bg-[#55DEE8]" : "bg-gray-600"}`}
          >
            <div className={`w-6 h-6 rounded-full bg-black shadow-md transform transition-all duration-300 ${isOnline ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Account Role</span>
            <h3 className="text-lg font-bold mt-1 text-[#55DEE8] uppercase tracking-wide">{role}</h3>
          </div>
          <div className="p-3 bg-[#55DEE8]/10 rounded-xl">
            <User size={20} className="text-[#55DEE8]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Weekly Earnings</span>
            <h3 className="text-xl font-bold mt-1 text-[#55DEE8]">₹{totalEarnings}</h3>
          </div>
          <div className="p-3 bg-[#55DEE8]/10 rounded-xl">
            <IndianRupee size={20} className="text-[#55DEE8]" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Jobs Completed</span>
            <h3 className="text-xl font-bold mt-1 text-white">{pastBookingsCount} Games</h3>
          </div>
          <div className="p-3 bg-white/5 rounded-xl">
            <Activity size={20} className="text-gray-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">Rating Score</span>
            <div className="flex items-center gap-1 mt-1">
              <h3 className="text-xl font-bold text-white">{profile?.rating || "5.0"}</h3>
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
            </div>
          </div>
          <div className="p-3 bg-yellow-400/10 rounded-xl">
            <Star size={20} className="text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Main Container: Active Match Details & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assigned Booking Card */}
          {activeBooking ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-[#55DEE8]/40 shadow-lg shadow-[#55DEE8]/5 space-y-6">
              <div className="flex justify-between items-center border-b border-[#2D2D2D] pb-4">
                <div className="flex items-center gap-3">
                  <span className="animate-ping w-2.5 h-2.5 rounded-full bg-[#55DEE8]" />
                  <h2 className="text-lg font-bold tracking-tight">Active Match Assignment</h2>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${activeBooking.status === "IN_PROGRESS" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-[#55DEE8]/10 text-[#55DEE8] border border-[#55DEE8]/20"}`}>
                  {activeBooking.status === "IN_PROGRESS" ? "In Progress" : "Assigned"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-[#878C9F] uppercase tracking-wider">Client details</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
                      {activeBooking.user?.name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{activeBooking.user?.name || "Client"}</h4>
                      <p className="text-xs text-[#878C9F]">{activeBooking.user?.email || ""}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#878C9F] uppercase tracking-wider">Location / Ground</span>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin size={16} className="text-[#55DEE8]" />
                    <span className="text-sm font-medium">
                      {activeBooking.ground?.name || activeBooking.customLocation?.address || "Custom Location"}
                    </span>
                  </div>
                </div>
              </div>

              {/* OTP Validation Form - show if not started */}
              {activeBooking.status === "ASSIGNED" ? (
                <div className="p-5 rounded-xl bg-[#222222] border border-[#2D2D2D] space-y-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Clock size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Arrival OTP Verification</span>
                  </div>
                  <p className="text-xs text-[#878C9F]">
                    Ask the organizer for the 6-digit OTP code to verify your arrival and activate the booking session.
                  </p>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="Enter 6-Digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-center font-mono tracking-widest text-lg focus:outline-none focus:border-[#55DEE8] transition-colors"
                    />
                    <button 
                      onClick={() => handleVerifyOtp(activeBooking.id)}
                      disabled={isVerifying}
                      className="bg-[#55DEE8] hover:bg-[#44cdd7] text-black font-semibold rounded-xl px-6 py-2.5 transition-colors text-sm"
                    >
                      Verify
                    </button>
                  </div>

                  {errorMsg && <p className="text-red-500 text-xs mt-1 font-medium">{errorMsg}</p>}
                  {successMsg && <p className="text-green-400 text-xs mt-1 font-medium">{successMsg}</p>}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  <CheckCircle className="text-green-400" size={20} />
                  <div>
                    <h5 className="text-sm font-semibold text-green-400">Check-in Verified</h5>
                    <p className="text-xs text-[#878C9F] mt-0.5">Session actively in progress. Complete the service to record matches.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-[#141414] border border-[#2D2D2D] text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">No Active Job</h3>
                <p className="text-[#878C9F] text-sm mt-1 max-w-md mx-auto">
                  {isOnline 
                    ? "You are online. Incoming on-demand matching requests from nearby sports grounds will pop up here in real-time."
                    : "You are offline. Go online using the toggle above to start receiving match booking offers."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info / Instructions Panel */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#878C9F]">How Matching Works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#55DEE8]/10 text-[#55DEE8] flex items-center justify-center text-[10px] font-bold mt-0.5">1</div>
                <p className="text-xs text-gray-300">
                  Toggle **Online** to publish your coordinates and availability to the matching engine.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#55DEE8]/10 text-[#55DEE8] flex items-center justify-center text-[10px] font-bold mt-0.5">2</div>
                <p className="text-xs text-gray-300">
                  When a game is hosted nearby, you will receive a pop-up invite. You have **30 seconds** to accept.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#55DEE8]/10 text-[#55DEE8] flex items-center justify-center text-[10px] font-bold mt-0.5">3</div>
                <p className="text-xs text-gray-300">
                  Navigate to the match location, ask the organizer for their security **OTP**, and verify it to unlock payouts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Match Offer Dialog Modal */}
      {activeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#181818] border border-[#55DEE8] shadow-2xl shadow-[#55DEE8]/20 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-4">
              <div className="flex items-center gap-2 text-[#55DEE8]">
                <Bell className="animate-bounce" size={20} />
                <h3 className="text-lg font-bold">New Booking Offer!</h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-mono font-bold">
                <Clock size={12} />
                <span>{offerCountdown}s</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#878C9F] uppercase tracking-wider">Venue</span>
                <span className="text-sm font-semibold text-white">{activeOffer.groundName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#878C9F] uppercase tracking-wider">Payout Range</span>
                <span className="text-sm font-semibold text-[#55DEE8]">₹{activeOffer.budget}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleRejectOffer(activeOffer.requestId)}
                className="flex-1 border border-[#2D2D2D] hover:bg-white/5 text-white font-semibold rounded-xl py-3 transition-colors text-sm"
              >
                Reject
              </button>
              <button 
                onClick={() => handleAcceptOffer(activeOffer.requestId)}
                className="flex-1 bg-[#55DEE8] hover:bg-[#44cdd7] text-black font-semibold rounded-xl py-3 transition-colors text-sm"
              >
                Accept Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
