import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, History, IndianRupee, Loader2, ShieldCheck, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { updateUser } from "@redux/slices/authSlice";
import { loadRazorpay } from "@infrastructure/razorpay";

const WalletPage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(0);
  const [reservedBalance, setReservedBalance] = useState(0);
  const [usableBalance, setUsableBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await axiosInstance.get("/api/user/wallet/data");
      setBalance(response.data.balance);
      setReservedBalance(response.data.reservedBalance);
      setUsableBalance(response.data.usableBalance);
      setTransactions(response.data.transactions);
      dispatch(updateUser({ 
        walletBalance: response.data.balance,
        reservedBalance: response.data.reservedBalance 
      }));
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!topupAmount || isNaN(topupAmount) || topupAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsProcessing(true);
      const { data } = await axiosInstance.post("/api/user/wallet/topup/create-order", {
        amount: Number(topupAmount),
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "Kridaz Wallet",
        description: "Wallet Coin Top-up",
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axiosInstance.post("/api/user/wallet/topup/verify", response);
            if (verifyRes.data.success) {
              toast.success("Wallet topped up successfully!");
              setTopupAmount("");
              fetchWalletData();
            }
          } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#55DEE8",
        },
      };

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load");
        setIsProcessing(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate top-up");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#55DEE8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-2 md:pt-24 pb-20 px-4 font-inter">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-open-sans">My Wallet</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest font-inter text-[20px]">Manage your coins & transactions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Balance Card */}
          <div className="md:col-span-5 space-y-6">
            <div className="relative group overflow-hidden bg-gradient-to-br from-[#55DEE8] to-[#BFF367] p-8 rounded-[15px] shadow-2xl shadow-[#55DEE8]/20 animate-slide-in-left text-black">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Wallet className="w-32 h-32 text-black" />
              </div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/20 rounded-xl backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  <span className="font-inter text-[20px] font-black uppercase text-black/70 tracking-wider">Available Coins</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-6xl font-black text-black tracking-tighter font-open-sans">{usableBalance}</span>
                    <IndianRupee className="w-8 h-8 text-black/50 mt-4" />
                  </div>
                  <p className="font-inter text-[20px] font-bold text-black/70 uppercase">Spendable Coins Right Now</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-black/10 rounded-2xl backdrop-blur-sm">
                    <p className="font-inter text-xs font-black uppercase text-black/60 mb-1">Total</p>
                    <p className="text-xl font-black text-black tracking-tighter font-open-sans">{balance}</p>
                  </div>
                  <div className="p-3 bg-black/10 rounded-2xl backdrop-blur-sm">
                    <p className="font-inter text-xs font-black uppercase text-black/60 mb-1">Reserved</p>
                    <p className="text-xl font-black text-black tracking-tighter font-open-sans">{reservedBalance}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-black/10">
                  <p className="font-inter text-xs font-bold text-black/60 uppercase">Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Top-up Form */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[15px] space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-3 font-open-sans">
                <Plus className="w-5 h-5 text-[#55DEE8]" />
                Top-up Wallet
              </h2>
              <div className="space-y-4 font-inter">
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 500)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-11 pr-3 text-sm font-bold focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] transition-all outline-none text-white font-inter"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 font-inter">
                  {[500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopupAmount(amt.toString())}
                      className="py-3 rounded-xl border border-zinc-800 hover:border-[#55DEE8] hover:text-[#55DEE8] font-bold text-xs uppercase transition-all"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleTopup}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black h-16 rounded-[15px] font-black uppercase tracking-wider flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale font-open-sans shadow-[0_10px_25px_rgba(85,222,232,0.25)]"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Purchase Coins
                      <ArrowUpRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="md:col-span-7 bg-zinc-900/50 border border-zinc-800 rounded-[15px] overflow-hidden flex flex-col font-inter">
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-3 font-open-sans">
                <History className="w-5 h-5 text-[#55DEE8]" />
                Coin Activity
              </h2>
              <span className="font-inter text-xs font-bold text-zinc-500 uppercase">Recent 20 entries</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="p-6 bg-zinc-800/50 rounded-full">
                    <History className="w-12 h-12 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 font-bold uppercase text-xs font-inter">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800 font-inter">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="p-6 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          tx.type === "TOPUP" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        }`}>
                          {tx.type === "TOPUP" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-200 font-inter">
                            {tx.description || tx.type}
                            {tx.description?.toLowerCase().includes("bonus") && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase rounded-md border border-yellow-500/20 font-inter">
                                Platform Offer
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase font-inter">
                            {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-inter">
                        <p className={`font-black text-lg font-open-sans ${
                          tx.type === "TOPUP" ? "text-emerald-500" : "text-zinc-200"
                        }`}>
                          {tx.type === "TOPUP" ? "+" : "-"}{tx.amount}
                        </p>
                        <div className="flex flex-col items-end gap-1 font-inter">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full font-inter ${
                            tx.status === "SUCCESS" ? "bg-[#55DEE8]/10 text-[#55DEE8]" : 
                            tx.status === "PENDING" ? "bg-amber-500/10 text-amber-500" : 
                            "bg-rose-500/10 text-rose-500"
                          }`}>
                            {tx.status}
                          </span>
                          {tx.status === "PENDING" && tx.type === "TOPUP" && (
                            <div className="flex gap-2 font-inter">
                              <button 
                                onClick={async () => {
                                  try {
                                    const { data } = await axiosInstance.get(`/api/user/wallet/topup/check-status/${tx.razorpayOrderId}`);
                                    if (data.success) {
                                      toast.success(data.message);
                                      fetchWalletData();
                                    } else {
                                      toast.error(data.message);
                                    }
                                  } catch (error) {
                                    toast.error("Failed to check status");
                                  }
                                }}
                                className="text-[8px] font-bold text-[#55DEE8] hover:underline uppercase"
                              >
                                Check Status
                              </button>
                              <span className="text-[8px] text-zinc-600">|</span>
                              <button 
                                onClick={() => {
                                  setTopupAmount(tx.amount.toString());
                                  handleTopup();
                                }}
                                className="text-[8px] font-bold text-zinc-400 hover:underline uppercase"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
