import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import { IndianRupee, ShieldCheck, X, Zap, Tag, Check, Loader2 } from "lucide-react";
import CountUp from "react-countup";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const CoinDeductionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  amount, 
  currentBalance,
  title = "Confirm Payment",
  description = "Are you sure you want to spend coins for this booking?",
  turfId
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const coinRef = useRef(null);
  const modalRef = useRef(null);
  const deductionRef = useRef(null);

  const finalAmount = appliedCoupon ? appliedCoupon.finalAmount : amount;

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setShowAnimation(false);
      setIsProcessing(false);
      setCouponCode("");
      setAppliedCoupon(null);
      gsap.fromTo(modalRef.current, 
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, [isOpen]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);
    try {
      const res = await axiosInstance.post("/api/user/booking/validate-coupon", {
        code: couponCode,
        turfId,
        amount
      });
      if (res.data.success) {
        setAppliedCoupon({ code: couponCode, discount: res.data.discount, finalAmount: res.data.finalAmount });
        toast.success("Coupon applied!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const result = await onConfirm(appliedCoupon?.code); // pass couponCode
      if (result && result.success) {
        setBookingId(result.bookingId);
        startAnimation();
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const startAnimation = () => {
    setShowAnimation(true);
    
    // Coin 3D Spin and Jump
    const tl = gsap.timeline({
      onComplete: () => {
        setIsSuccess(true);
        setShowAnimation(false);
      }
    });

    tl.to(coinRef.current, {
      rotationY: 1080,
      y: -150,
      scale: 1.5,
      duration: 1.5,
      ease: "power2.out"
    })
    .to(deductionRef.current, {
      opacity: 1,
      y: -20,
      duration: 0.5,
    }, "-=0.8")
    .to(coinRef.current, {
      opacity: 0,
      scale: 0.5,
      y: -200,
      duration: 0.5,
      ease: "power2.in"
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-500 ${showAnimation ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/80 backdrop-blur-md'}`}>
      {!showAnimation && !isSuccess ? (
        <div 
          ref={modalRef}
          className="bg-[#0A0A0A] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#84CC16]/10 rounded-2xl flex items-center justify-center mx-auto text-[#84CC16]">
              <Zap size={32} fill="currentColor" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{title}</h3>
              <p className="text-zinc-500 text-xs font-medium">{description}</p>
            </div>
          </div>

          {/* Amount Section */}
          <div className="px-8 py-6 bg-white/5 border-y border-white/5 flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount to Deduct</p>
            {appliedCoupon ? (
              <div className="flex flex-col items-center">
                <span className="text-zinc-500 line-through text-sm flex items-center"><IndianRupee size={12}/>{amount}</span>
                <div className="flex items-center gap-2 text-[#84CC16]">
                  <IndianRupee size={24} className="font-bold" />
                  <span className="text-4xl font-black">{finalAmount}</span>
                </div>
                <span className="text-[#84CC16] text-[10px] font-bold mt-1 bg-[#84CC16]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">You save ₹{appliedCoupon.discount}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[#84CC16]">
                <IndianRupee size={24} className="font-bold" />
                <span className="text-4xl font-black">{amount}</span>
              </div>
            )}
          </div>

          {/* Coupon Section */}
          <div className="px-8 pt-6 pb-2">
            {!appliedCoupon ? (
              <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl p-1.5 focus-within:border-[#84CC16]/50 transition-colors">
                <div className="pl-3 text-zinc-500">
                  <Tag size={16} />
                </div>
                <input 
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="bg-transparent text-white text-xs font-bold uppercase tracking-widest w-full outline-none placeholder:text-zinc-700"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || isValidating}
                  className="bg-[#84CC16] text-black px-4 py-2 rounded-[8px] text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 transition-colors"
                >
                  {isValidating ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#84CC16]/10 border border-[#84CC16]/20 rounded-xl p-3">
                <div className="flex items-center gap-2 text-[#84CC16]">
                  <Check size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">{appliedCoupon.code}</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-zinc-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Balance Section */}
          <div className="p-8 space-y-6 pt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-bold uppercase">Your Balance</span>
              <span className="text-white font-bold">{currentBalance} Coins</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={isProcessing || currentBalance < finalAmount}
                className="w-full bg-[#84CC16] text-black h-14 rounded-2xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : currentBalance < finalAmount ? (
                  "Insufficient Balance"
                ) : (
                  "Confirm & Pay"
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="w-full bg-white/5 text-zinc-400 h-14 rounded-2xl font-bold uppercase text-xs tracking-wider hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-zinc-600 uppercase">
              <ShieldCheck size={12} />
              Secure Coin Transaction
            </div>
          </div>
        </div>
      ) : isSuccess ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0A0A0A] border border-[#84CC16]/30 w-full max-w-sm rounded-[32px] p-8 text-center shadow-[0_0_50px_rgba(132,204,22,0.1)]"
        >
          <div className="w-20 h-20 bg-[#84CC16] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(132,204,22,0.4)]">
            <ShieldCheck size={40} className="text-black" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Booking Confirmed!</h3>
          <p className="text-zinc-500 text-sm mb-8 font-medium">Your match is ready. Check your digital pass for entry details.</p>
          
          <div className="space-y-3">
            <a 
              href={`/booking-pass/${bookingId}`}
              className="w-full bg-[#84CC16] text-black h-14 rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              View Booking Pass
            </a>
            <button 
              onClick={onClose}
              className="w-full bg-white/5 text-white h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      ) : (
        /* The Animation Overlay - Transparent */
        <div className="relative flex flex-col items-center justify-center">
          {/* Deducted Amount Float */}
          <div 
            ref={deductionRef}
            className="absolute top-[-120px] opacity-0 text-[#84CC16] font-black text-6xl italic drop-shadow-[0_0_20px_rgba(132,204,22,0.5)]"
          >
            -{finalAmount}
          </div>

          {/* 3D Spinning Coin */}
          <div 
            ref={coinRef}
            className="w-40 h-40 relative preserve-3d"
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
          >
            {/* Front of Coin */}
            <div className="absolute inset-0 rounded-full bg-[#84CC16] border-[6px] border-[#a3e635] flex items-center justify-center shadow-[0_0_50px_rgba(132,204,22,0.6)]">
              <IndianRupee size={64} className="text-black font-black" />
            </div>
            {/* Back of Coin */}
            <div 
              className="absolute inset-0 rounded-full bg-[#65a30d] border-[6px] border-[#84CC16] flex items-center justify-center"
              style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
            >
              <Zap size={64} className="text-black" />
            </div>
          </div>

          {/* New Balance Text */}
          <div className="mt-16 text-center space-y-2">
            <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] opacity-70">Updating Wallet</p>
            <div className="text-white text-6xl font-black italic">
              <CountUp 
                start={currentBalance} 
                end={currentBalance - finalAmount} 
                duration={2} 
                separator=","
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinDeductionModal;
