import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  IndianRupee, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  MapPin, 
  ChevronLeft, 
  Zap, 
  Wallet, 
  Smartphone, 
  CreditCard, 
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  PlusCircle,
  Tag,
  Info,
  Shield,
  Lock,
  CreditCard as CardIcon
} from "lucide-react";
import { format } from "date-fns";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { handlePayment, createOrder } from "@infrastructure/razorpay";

// Helper: parse "01:00 PM" slot time + date into ISO string
const buildDateTime = (dateStr, timeStr, addHrs = 0) => {
  const base = new Date(dateStr);
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
  base.setHours(hours + addHrs, minutes, 0, 0);
  return base.toISOString();
};

const CheckoutPage = () => {
  const { turfId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Extract booking data from location state or fallback
  const bookingData = location.state || {};
  const { 
    turfName, 
    selectedDate, 
    startTime, 
    duration, 
    amount,
    location: turfLocation 
  } = bookingData;

  const [paymentPercentage, setPaymentPercentage] = useState(30); 
  const [paymentMode, setPaymentMode] = useState("WALLET");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(user?.walletBalance || 0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [step, setStep] = useState("PAYMENT"); 
  const [bookingId, setBookingId] = useState(null);

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosInstance.get("/api/admin/settings/payout");
        setSettings(response.data.payoutSettings);
      } catch (err) {
        console.error("Failed to fetch payout settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Calculations
  const venueCharges = amount || 0;
  const serviceCharge = Math.round(venueCharges * 0.0125) || 25; 
  const gstAmount = 0;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = venueCharges + serviceCharge + gstAmount - discount;
  const amountToPay = Math.round(total * (paymentPercentage / 100));
  const balanceAtVenue = total - amountToPay;

  useEffect(() => {
    if (!turfId || !startTime || !selectedDate) {
      toast.error("Invalid booking details. Please select a slot again.");
      navigate(`/turf/${turfId}`);
    }
  }, [turfId, startTime, selectedDate, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);
    try {
      const res = await axiosInstance.post("/api/user/booking/validate-coupon", {
        code: couponCode,
        turfId,
        amount: venueCharges
      });
      if (res.data.success) {
        setAppliedCoupon({ 
          code: couponCode, 
          discount: res.data.discount 
        });
        toast.success("Coupon applied successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    const paymentType = paymentPercentage === 100 ? "FULL" : "PARTIAL";
    const advanceAmount = amountToPay;
    const balanceAmount = balanceAtVenue;

    const startISO = buildDateTime(selectedDate, startTime);
    const endISO = buildDateTime(selectedDate, startTime, duration);
    const dateISO = new Date(selectedDate).toISOString();

    try {
      if (paymentMode === "WALLET") {
        const bookingPayload = {
          turfId,
          startTime: startISO,
          endTime: endISO,
          selectedTurfDate: dateISO,
          totalPrice: total,
          advanceAmount,
          balanceAmount,
          paymentType,
          paymentPercentage,
          ...(appliedCoupon?.code && { couponCode: appliedCoupon.code })
        };

        const res = await axiosInstance.post("/api/user/booking/book-with-wallet", bookingPayload);

        if (res.data.success) {
          setCurrentBalance(res.data.newBalance ?? currentBalance);
          setBookingId(res.data.bookingId);
          setStep("SUCCESS");
          toast.success("Booking confirmed!");
        }
      } else {
        const { order } = await createOrder(advanceAmount);
        const paymentResult = await handlePayment(order, user);

        const res = await axiosInstance.post("/api/user/booking/verify-payment", {
          turfId,
          startTime: startISO,
          endTime: endISO,
          selectedTurfDate: dateISO,
          totalPrice: total,
          advanceAmount,
          balanceAmount,
          paymentType,
          paymentId: paymentResult.razorpay_payment_id,
          orderId: paymentResult.razorpay_order_id,
          razorpay_signature: paymentResult.razorpay_signature,
          paymentMethod: paymentMode
        });

        if (res.data.success) {
          setBookingId(res.data.bookingId);
          setStep("SUCCESS");
          toast.success("Payment successful!");
        }
      }
    } catch (error) {
      console.error("Payment Error:", error);
      const msg = error.response?.data?.message || error.message || "Payment failed. Please try again.";
      toast.error(msg);
      if (msg.toLowerCase().includes("insufficient")) {
        navigate("/wallet");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === "SUCCESS") {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <svg width="0" height="0" className="hidden">
          <defs>
            <linearGradient id="theme-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#55DEE8" />
              <stop offset="100%" stopColor="#BFF367" />
            </linearGradient>
          </defs>
        </svg>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 p-12 rounded-[15px] text-center max-w-xl w-full relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#55DEE8] to-[#BFF367]" />
          <div className="w-24 h-24 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(85,222,232,0.3)]">
            <Check size={48} className="text-black stroke-[3px]" />
          </div>
          
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 font-open-sans">Slot Secured!</h2>
          <p className="text-zinc-400 font-bold uppercase text-[20px] tracking-widest mb-10 font-inter">Your booking at {turfName} is confirmed.</p>
          
          <div className="grid grid-cols-1 gap-4">
            <Link 
              to={`/booking-pass/${bookingId}`}
              className="bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black h-16 rounded-[15px] font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
            >
              Download Digital Pass
              <ArrowRight size={20} />
            </Link>
            <Link 
              to="/booking-history"
              className="bg-zinc-800 text-white h-16 rounded-[15px] font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all"
            >
              View Booking History
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white py-10 px-4 md:px-8 font-inter">
      {/* SVG Definitions for global gradient */}
      <svg width="0" height="0" className="hidden">
        <defs>
          <linearGradient id="theme-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#55DEE8" />
            <stop offset="100%" stopColor="#BFF367" />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors shrink-0"
          >
            <ArrowLeft size={20} style={{ stroke: 'url(#theme-gradient)' }} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase font-open-sans">Checkout</h1>
            <p className="text-zinc-500 text-[20px] mt-1 uppercase tracking-wide font-bold font-inter">Review your booking details and complete your payment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Summary */}
          <div className="lg:col-span-7 bg-[#121212] border border-zinc-800 rounded-[15px] overflow-hidden">
            {/* Hero Image */}
            <div className="h-[200px] w-full bg-zinc-900">
              <img src="/banner-1.png" className="w-full h-full object-cover opacity-80" alt="Venue" />
            </div>

            {/* Turf Title & Time */}
            <div className="p-6 border-b border-zinc-800/50">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-[15px] bg-[#55DEE8]/10 border border-[#55DEE8]/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" style={{ stroke: 'url(#theme-gradient)' }} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight font-open-sans">{turfName || "Kridaz Venue"}</h2>
                  <div className="flex items-center gap-3 text-zinc-400 text-xs mt-1.5 font-bold uppercase tracking-wide">
                    <Clock className="w-4 h-4" /> 
                    <span>{startTime} ({duration} hr)</span> 
                    <span className="text-zinc-700">|</span> 
                    <Calendar className="w-4 h-4" /> 
                    <span>{selectedDate ? format(new Date(selectedDate), "MM/dd/yyyy") : "Select Date"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Details */}
            <div className="p-6 space-y-5 border-b border-zinc-800/50">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-open-sans">Price Details</h3>
              <div className="flex justify-between text-sm text-zinc-400 font-medium">
                <span>Slot Price</span>
                <span className="text-white">₹ {venueCharges}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400 font-medium">
                <span className="flex items-center gap-2">Service Charge <Info className="w-4 h-4 text-zinc-500" /></span>
                <span className="text-white">₹ {serviceCharge}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹ {discount}</span>
                </div>
              )}
            </div>

            {/* Total Amount */}
            <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center">
              <span className="text-zinc-300 font-bold uppercase text-sm tracking-wide font-open-sans">Total Amount</span>
              <span className="font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">₹ {total}</span>
            </div>

            {/* Coupon Box & Secure Label */}
            <div className="p-6">
              {/* Coupon Code */}
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="ENTER COUPON CODE"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-[15px] py-3.5 pl-12 pr-4 text-xs uppercase tracking-widest font-bold text-white outline-none focus:border-[#55DEE8]/50 transition-all placeholder:text-zinc-600"
                  />
                </div>
                <button 
                  onClick={handleApplyCoupon}
                  disabled={isValidating || !couponCode}
                  className="bg-zinc-800 text-zinc-300 px-8 rounded-[15px] text-xs font-black uppercase tracking-widest hover:bg-zinc-700 transition-all disabled:opacity-50"
                >
                  {isValidating ? <Loader2 size={18} className="animate-spin" /> : "APPLY"}
                </button>
              </div>

              {/* Secure box */}
              <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[15px] p-5 flex gap-4 items-center">
                <ShieldCheck className="w-8 h-8 shrink-0" style={{ stroke: 'url(#theme-gradient)' }} />
                <div>
                  <p className="text-lg font-bold text-zinc-200 font-open-sans">Secure & Safe Payments</p>
                  <p className="text-xs text-zinc-500 mt-1 font-medium font-inter">Your payment information is encrypted and secure.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Plan & Payment Method */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Payment Plan Box */}
            <div className="bg-[#121212] border border-zinc-800 rounded-[15px] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-300 uppercase tracking-wide font-open-sans">Select Payment Plan</h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium font-inter">Flexible advance options available</p>
                </div>
                <div className="bg-[#BFF367]/10 px-2 py-1 rounded-full flex items-center gap-1.5 border border-[#BFF367]/20">
                  <Zap size={12} style={{ stroke: 'url(#theme-gradient)', fill: 'url(#theme-gradient)' }} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">Secure Pay</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[30, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setPaymentPercentage(pct)}
                    className={`relative p-4 rounded-[15px] border transition-all flex flex-col items-center gap-1.5 ${
                      paymentPercentage === pct 
                      ? "bg-[#1C1C1C] border-[#BFF367] shadow-[0_0_10px_rgba(191,243,103,0.1)]" 
                      : "bg-[#0A0A0A] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <span className={`text-xl font-black ${paymentPercentage === pct ? "text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]" : "text-zinc-500"}`}>
                      {pct}%
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                      {pct === 100 ? "Full Pay" : "Advance"}
                    </span>
                    {paymentPercentage === pct && (
                      <motion.div 
                        layoutId="active-plan"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-black shadow-lg bg-gradient-to-r from-[#55DEE8] to-[#BFF367]"
                      >
                        <Check size={12} strokeWidth={4} />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-[#0A0A0A] p-3 rounded-[15px] border border-zinc-800/50 flex flex-col items-center text-center">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pay Now</p>
                  <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367]">₹{amountToPay}</p>
                </div>
                <div className="bg-[#0A0A0A] p-3 rounded-[15px] border border-zinc-800/50 flex flex-col items-center text-center">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pay at Venue</p>
                  <p className="text-lg font-black text-orange-500">₹{balanceAtVenue}</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-[#121212] border border-zinc-800 rounded-[15px] p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-zinc-300 uppercase tracking-wide font-open-sans">Payment Mode</h3>
                <p className="text-xs text-zinc-500 mt-1.5 font-medium font-inter">Choose your preferred payment option</p>
              </div>

              <div className="space-y-3">
                {/* Wallet */}
                <button 
                  onClick={() => setPaymentMode("WALLET")}
                  className={`w-full flex items-center justify-between p-4 rounded-[15px] border transition-all ${
                    paymentMode === "WALLET" ? "bg-[#BFF367]/5 border-[#BFF367]" : "bg-[#0A0A0A] border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0 ${paymentMode === "WALLET" ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black" : "bg-zinc-800 text-zinc-400"}`}>
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold uppercase tracking-wide ${paymentMode === "WALLET" ? "text-white" : "text-zinc-300"}`}>Kridaz Wallet</span>
                        <span className="bg-[#BFF367]/20 text-[#BFF367] text-[8px] font-bold px-2 py-0.5 rounded uppercase">{settings?.cashbackPercentage || 5}% CASHBACK</span>
                      </div>
                      <div className="text-xs text-zinc-500 font-medium">Available Balance: ₹{currentBalance}</div>
                    </div>
                  </div>
                  {paymentMode === "WALLET" && <Check className="w-5 h-5" style={{ stroke: 'url(#theme-gradient)' }} />}
                </button>

                {/* UPI */}
                <div 
                  className={`w-full rounded-[15px] border transition-all overflow-hidden ${
                    paymentMode === "UPI" ? "bg-[#BFF367]/5 border-[#BFF367]" : "bg-[#0A0A0A] border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div 
                    onClick={() => setPaymentMode("UPI")}
                    className="w-full flex items-center justify-between p-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0 ${paymentMode === "UPI" ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black" : "bg-zinc-800 text-zinc-400"}`}>
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold uppercase tracking-wide ${paymentMode === "UPI" ? "text-white" : "text-zinc-300"}`}>Instant UPI Payment</p>
                        <p className="text-xs text-zinc-500 mt-1 font-medium">Google Pay, PhonePe, Paytm</p>
                      </div>
                    </div>
                    {paymentMode === "UPI" && <Check className="w-5 h-5" style={{ stroke: 'url(#theme-gradient)' }} />}
                  </div>

                  <AnimatePresence>
                    {paymentMode === "UPI" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <div className="pt-4 border-t border-zinc-800/50 mt-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Enter UPI ID</label>
                          <input 
                            type="text" 
                            placeholder="username@bank"
                            className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-[#55DEE8]/50 transition-all placeholder:text-zinc-700"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cards */}
                <div 
                  className={`w-full rounded-[15px] border transition-all overflow-hidden ${
                    paymentMode === "CARD" ? "bg-[#BFF367]/5 border-[#BFF367]" : "bg-[#0A0A0A] border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div 
                    onClick={() => setPaymentMode("CARD")}
                    className="w-full flex items-center justify-between p-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[15px] flex items-center justify-center shrink-0 ${paymentMode === "CARD" ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black" : "bg-zinc-800 text-zinc-400"}`}>
                        <CardIcon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold uppercase tracking-wide ${paymentMode === "CARD" ? "text-white" : "text-zinc-300"}`}>Credit / Debit Cards</p>
                        <p className="text-xs text-zinc-500 mt-1 font-medium">Visa, Mastercard, Rupay</p>
                      </div>
                    </div>
                    {paymentMode === "CARD" && <Check className="w-5 h-5" style={{ stroke: 'url(#theme-gradient)' }} />}
                  </div>

                  <AnimatePresence>
                    {paymentMode === "CARD" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <div className="pt-4 border-t border-zinc-800/50 mt-2 space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Card Number</label>
                            <input 
                              type="text" 
                              placeholder="0000 0000 0000 0000"
                              className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-[#55DEE8]/50 transition-all placeholder:text-zinc-700"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Expiry Date</label>
                              <input 
                                type="text" 
                                placeholder="MM/YY"
                                className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-[#55DEE8]/50 transition-all placeholder:text-zinc-700"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">CVV</label>
                              <input 
                                type="password" 
                                placeholder="123"
                                maxLength="3"
                                className="w-full bg-[#121212] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-[#55DEE8]/50 transition-all placeholder:text-zinc-700"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Error or Pay Now */}
              <div className="pt-6">
                {paymentMode === "WALLET" && currentBalance < amountToPay ? (
                  <>
                    <div className="border border-red-500/20 bg-red-500/5 rounded-[15px] p-4 flex gap-3 items-center mb-4">
                      <Info className="text-red-500 w-5 h-5 shrink-0" />
                      <p className="text-xs text-red-500 font-medium">
                        Your wallet balance is insufficient for this booking.<br />
                        Required: ₹{amountToPay}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/wallet")}
                      className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black py-4 rounded-[15px] flex items-center justify-center px-6 hover:brightness-110 font-bold transition-all gap-2 tracking-wide"
                    >
                      <PlusCircle className="w-5 h-5" /> RECHARGE WALLET
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black py-4 rounded-[15px] flex items-center justify-between px-6 hover:brightness-110 font-bold transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 tracking-wide">
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} 
                      {isProcessing ? "PROCESSING..." : "PAY NOW"}
                    </div>
                    <span className="text-lg">₹ {amountToPay}</span>
                  </button>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-5 text-[10px] text-zinc-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ stroke: 'url(#theme-gradient)' }} />
                  End-to-end encrypted • PCI DSS Compliant
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
