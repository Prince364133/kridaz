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
 Check,
 Loader2,
 PlusCircle,
 Tag,
 Info,
 Shield,
 CreditCard as CardIcon
} from "lucide-react";
import { format } from "date-fns";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { handlePayment, createOrder } from "../../config/razorpay";

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

 // No useReservation here — all booking data comes from location.state

 const [paymentPercentage, setPaymentPercentage] = useState(100);
 const [paymentMode, setPaymentMode] = useState("WALLET");
 const [isProcessing, setIsProcessing] = useState(false);
 const [currentBalance, setCurrentBalance] = useState(user?.walletBalance || 0);
 const [couponCode, setCouponCode] = useState("");
 const [appliedCoupon, setAppliedCoupon] = useState(null);
 const [isValidating, setIsValidating] = useState(false);
 const [step, setStep] = useState("PAYMENT"); // PAYMENT, RECHARGE, SUCCESS
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
 const gstPercent = 0;
 const gstAmount = 0;
 const discount = appliedCoupon ? appliedCoupon.discount : 0;
 const total = venueCharges + gstAmount - discount;
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

 // Build ISO strings from the slot strings in location.state
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
 // Card / UPI — launch Razorpay
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
 <div className="min-h-screen bg-black flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="bg-zinc-900 border border-zinc-800 p-12 rounded-[3rem] text-center max-w-xl w-full relative overflow-hidden"
 >
 <div className="absolute top-0 left-0 w-full h-1 bg-[#55DEE8]" />
 <div className="w-24 h-24 bg-[#55DEE8] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(204,255,0,0.3)]">
 <Check size={48} className="text-black stroke-[3px]" />
 </div>
 
 <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Slot Secured!</h2>
 <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest mb-10">Your professional booking at {turfName} is confirmed.</p>
 
 <div className="grid grid-cols-1 gap-4">
 <Link 
 to={`/booking-pass/${bookingId}`}
 className="bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black h-16 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
 >
 Download Digital Pass
 <ArrowRight size={20} />
 </Link>
 <Link 
 to="/booking-history"
 className="bg-zinc-800 text-white h-16 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all"
 >
 View Booking History
 </Link>
 </div>
 </motion.div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-black text-white py-12 px-4 md:px-8">
 <div className="max-w-6xl mx-auto">
 {/* Header */}
 <div className="flex items-center justify-between mb-12">
 <button 
 onClick={() => navigate(-1)}
 className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
 >
 <ChevronLeft size={16} />
 Back to Pitch
 </button>
 <div className="flex items-center gap-3">
 <ShieldCheck size={20} className="text-[#55DEE8]" />
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Kridaz Secure Checkout</span>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
 {/* Left Column: Summary */}
 <div className="lg:col-span-5 space-y-8">
 <div className="space-y-2">
 <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Checkout</h1>
 <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest ">Review your professional reservation</p>
 </div>

 <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-xl">
 {/* Venue Details */}
 <div className="flex gap-6">
 <div className="w-24 h-24 bg-zinc-800 rounded-[1.5rem] overflow-hidden shrink-0 border border-zinc-700">
 <img src="/banner-1.png" className="w-full h-full object-cover opacity-50" alt="" />
 </div>
 <div className="space-y-2">
 <h3 className="text-xl font-black uppercase tracking-tight">{turfName}</h3>
 <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase">
 <MapPin size={14} className="text-[#55DEE8]" />
 {turfLocation || "Verified Arena"}
 </div>
 </div>
 </div>

 {/* Slot Details */}
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-black/40 p-5 rounded-2xl border border-zinc-800/50">
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Schedule</p>
 <div className="flex items-center gap-2">
 <Calendar size={16} className="text-[#55DEE8]" />
 <span className="text-sm font-black uppercase tracking-tight">{format(new Date(selectedDate), "EEE, MMM d")}</span>
 </div>
 </div>
 <div className="bg-black/40 p-5 rounded-2xl border border-zinc-800/50">
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Timing</p>
 <div className="flex items-center gap-2">
 <Clock size={16} className="text-[#55DEE8]" />
 <span className="text-sm font-black uppercase tracking-tight">{startTime} ({duration}hr)</span>
 </div>
 </div>
 </div>

 {/* Price Breakdown */}
 <div className="space-y-4 pt-4">
 <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-500">
 <span>Base Amount</span>
 <span className="text-white">₹{venueCharges}</span>
 </div>

 {appliedCoupon && (
 <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-[#55DEE8]">
 <span>Discount ({appliedCoupon.code})</span>
 <span>-₹{discount}</span>
 </div>
 )}
 <div className="h-px bg-zinc-800 my-4" />
 <div className="flex justify-between items-baseline">
 <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Total Value</span>
 <span className="text-4xl font-black text-[#55DEE8]">₹{total}</span>
 </div>
 </div>

 {/* Coupon Box */}
 <div className="relative pt-4">
 <div className="flex gap-2">
 <div className="relative flex-1">
 <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
 <input 
 type="text" 
 placeholder="COUPON CODE"
 value={couponCode}
 onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
 className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:border-white/30/50 outline-none transition-all placeholder:text-zinc-700"
 />
 </div>
 <button 
 onClick={handleApplyCoupon}
 disabled={isValidating || !couponCode}
 className="px-6 bg-zinc-800 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 transition-all disabled:opacity-50"
 >
 {isValidating ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column: Payment Selection */}
 <div className="lg:col-span-7 space-y-8">
 <div className="grid grid-cols-1 gap-8">
 {/* Advance Selection */}
 <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
 <div className="flex items-center justify-between">
 <div className="space-y-1">
 <h3 className="text-xl font-black uppercase tracking-tight">Select Payment Plan</h3>
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Flexible advance options available</p>
 </div>
 <div className="bg-[#55DEE8]/10 px-3 py-1.5 rounded-full flex items-center gap-2">
 <Zap size={14} className="text-[#55DEE8] fill-[#55DEE8]" />
 <span className="text-[9px] font-black text-[#55DEE8] uppercase tracking-widest">Secure Pay</span>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4">
 {[30, 50, 100].map((pct) => (
 <button
 key={pct}
 onClick={() => setPaymentPercentage(pct)}
 className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 group ${
 paymentPercentage === pct 
 ? "bg-[#55DEE8]/5 border-[#55DEE8] text-[#55DEE8]" 
 : "bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
 }`}
 >
 <span className={`text-2xl font-black ${paymentPercentage === pct ? "text-[#55DEE8]" : "text-zinc-400"}`}>
 {pct}%
 </span>
 <span className="text-[9px] font-black uppercase tracking-widest">
 {pct === 100 ? "Full Pay" : "Advance"}
 </span>
 {paymentPercentage === pct && (
 <motion.div 
 layoutId="active-plan"
 className="absolute -top-2 -right-2 w-6 h-6 bg-[#55DEE8] rounded-full flex items-center justify-center text-black shadow-lg"
 >
 <Check size={14} strokeWidth={4} />
 </motion.div>
 )}
 </button>
 ))}
 </div>

 <div className="grid grid-cols-2 gap-4 pt-2">
 <div className="bg-black/20 p-4 rounded-2xl border border-zinc-800/50 flex flex-col items-center text-center">
 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Pay Now</p>
 <p className="text-xl font-black text-[#55DEE8]">₹{amountToPay}</p>
 </div>
 <div className="bg-black/20 p-4 rounded-2xl border border-zinc-800/50 flex flex-col items-center text-center">
 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Pay at Venue</p>
 <p className="text-xl font-black text-orange-500">₹{balanceAtVenue}</p>
 </div>
 </div>
 </div>

 {/* Payment Mode */}
 <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
 <div className="flex items-center justify-between">
 <div className="space-y-1">
 <h3 className="text-xl font-black uppercase tracking-tight">Payment Mode</h3>
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Select your preferred method</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-3">
 {/* Wallet */}
 <button 
 onClick={() => setPaymentMode("WALLET")}
 className={`group relative flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${
 paymentMode === "WALLET" ? "bg-[#55DEE8]/5 border-[#55DEE8]" : "bg-black/40 border-zinc-800 hover:border-zinc-700"
 }`}
 >
 <div className="flex items-center gap-5">
 <div className={`p-4 rounded-2xl ${paymentMode === "WALLET" ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]" : "bg-zinc-800 text-zinc-500"}`}>
 <Wallet size={24} />
 </div>
 <div className="text-left">
 <div className="flex items-center gap-3">
 <p className={`text-sm font-black uppercase tracking-tight ${paymentMode === "WALLET" ? "text-white" : "text-zinc-400"}`}>Kridaz Wallet</p>
 <span className="bg-[#55DEE8]/10 text-[#55DEE8] text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{settings?.cashbackPercentage || 5}% Cashback</span>
 </div>
 <p className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-widest">Available Balance: ₹{currentBalance}</p>
 </div>
 </div>
 {paymentMode === "WALLET" && <Check size={20} className="text-[#55DEE8] stroke-[3px]" />}
 </button>

 {/* UPI */}
 <button 
 onClick={() => setPaymentMode("UPI")}
 className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${
 paymentMode === "UPI" ? "bg-[#55DEE8]/5 border-[#55DEE8]" : "bg-black/40 border-zinc-800 hover:border-zinc-700"
 }`}
 >
 <div className="flex items-center gap-5">
 <div className={`p-4 rounded-2xl ${paymentMode === "UPI" ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]" : "bg-zinc-800 text-zinc-500"}`}>
 <Smartphone size={24} />
 </div>
 <div className="text-left">
 <p className={`text-sm font-black uppercase tracking-tight ${paymentMode === "UPI" ? "text-white" : "text-zinc-400"}`}>Instant UPI Payment</p>
 <p className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-widest ">Google Pay, PhonePe, Paytm</p>
 </div>
 </div>
 {paymentMode === "UPI" && <Check size={20} className="text-[#55DEE8] stroke-[3px]" />}
 </button>

 {/* Card */}
 <button 
 onClick={() => setPaymentMode("CARD")}
 className={`flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all ${
 paymentMode === "CARD" ? "bg-[#55DEE8]/5 border-[#55DEE8]" : "bg-black/40 border-zinc-800 hover:border-zinc-700"
 }`}
 >
 <div className="flex items-center gap-5">
 <div className={`p-4 rounded-2xl ${paymentMode === "CARD" ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]" : "bg-zinc-800 text-zinc-500"}`}>
 <CardIcon size={24} />
 </div>
 <div className="text-left">
 <p className={`text-sm font-black uppercase tracking-tight ${paymentMode === "CARD" ? "text-white" : "text-zinc-400"}`}>Credit / Debit Cards</p>
 <p className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-widest">Visa, Mastercard, RuPay</p>
 </div>
 </div>
 {paymentMode === "CARD" && <Check size={20} className="text-[#55DEE8] stroke-[3px]" />}
 </button>
 </div>

 {/* Confirm Action */}
 <div className="pt-4 space-y-4">
 {paymentMode === "WALLET" && currentBalance < amountToPay ? (
 <div className="space-y-4">
 <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4">
 <Info size={20} className="text-red-500 shrink-0" />
 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
 Your wallet balance is insufficient for this booking. Required: ₹{amountToPay}
 </p>
 </div>
 <button
 onClick={() => navigate("/wallet")}
 className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
 >
 <PlusCircle size={20} />
 Recharge Wallet Now
 </button>
 </div>
 ) : (
 <button
 onClick={handleConfirmPayment}
 disabled={isProcessing}
 className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black h-20 rounded-[1.5rem] font-black uppercase text-base tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_15px_40px_rgba(204,255,0,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
 >
 {isProcessing ? (
 <div className="flex items-center gap-4">
 <Loader2 className="animate-spin" />
 <span>Authorizing...</span>
 </div>
 ) : (
 <>
 Authorize Payment ₹{amountToPay}
 <ArrowRight size={24} />
 </>
 )}
 </button>
 )}
 <p className="text-center text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
 End-to-end Encrypted • PCI DSS Compliant
 </p>
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
