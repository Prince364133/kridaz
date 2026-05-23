import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Turnstile from "react-turnstile";
import OnboardingModal from "@components/modals/OnboardingModal";
import { ArrowRight, ChevronLeft, User as UserIcon, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useDispatch } from "react-redux";
import { login } from "@redux/slices/authSlice";

const SignUp = () => {
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState('unified'); // 'unified', 'email', 'phone'
  const [step, setStep] = useState(1); // 1: Input, 2: OTP, 3: Password
  
  const [countryCode, setCountryCode] = useState("+91");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setMounted(true);
    const inviteToken = searchParams.get("inviteToken") || searchParams.get("invite");
    const inviter = searchParams.get("inviter");
    const teamId = searchParams.get("teamId");
    
    const umpireToken = searchParams.get("umpireInvite");

    if (inviteToken) {
      localStorage.setItem("pendingTeamInvite", inviteToken);
      if (teamId) localStorage.setItem("pendingTeamId", teamId);
      
      const emailParam = searchParams.get("email");
      if (emailParam) setIdentifier(decodeURIComponent(emailParam));

      if (inviter) {
        toast.success(`You are invited by ${inviter} to join their team!`, { duration: 6000, icon: '👋' });
      }
    }
    
    if (umpireToken) {
      localStorage.setItem("umpireInvite", umpireToken);
      const emailParam = searchParams.get("email");
      if (emailParam) setIdentifier(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error("Phone number required");

    const isPhone = /^\d{10}$/.test(identifier);

    if (!isPhone) {
      return toast.error("Please enter a valid 10-digit phone number");
    }

    setAuthMode('phone');
    
    const formattedPhone = countryCode + identifier;

    setPhone(formattedPhone);
    
    setLoading(true);
    try {
      const payload = { phone: formattedPhone };
      const res = await axiosInstance.post('/api/user/auth/send-otp', payload);
      toast.success(res.data.message);
      if (res.data.testOtp) {
         toast(`Test OTP: ${res.data.testOtp.phone}`, { icon: '🧑‍💻', duration: 10000 });
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error("Valid 6-digit OTP required");
    
    setLoading(true);
    try {
      const payload = authMode === 'email' ? { email, otp } : { phone, otp };
      const res = await axiosInstance.post('/api/user/auth/verify-otp', payload);
      
      if (res.data.success) {
        toast.success("OTP verified successfully!");
        setOnboardingData({
          authMethod: authMode,
          email: authMode === 'email' ? email : '',
          phone: authMode === 'phone' ? phone : '',
          otp,
          password: "",
          registrationToken: res.data.registrationToken
        });
        setShowOnboarding(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    
    setOnboardingData({
      authMethod: authMode,
      email: authMode === 'email' ? email : '',
      phone: authMode === 'phone' ? phone : '',
      otp,
      password
    });
    setShowOnboarding(true);
  };

  const handleGoogleSuccess = async (googleResponse) => {
      // console.log("GOOGLE RESPONSE received");
      setLoading(true);
      try {
        const inviteToken = localStorage.getItem("pendingInvite");
        const umpireInvite = localStorage.getItem("umpireInvite");
        const payload = { role: "user", inviteToken, umpireInvite };
        if (googleResponse.credential) {
          payload.credential = googleResponse.credential;
        } else if (googleResponse.access_token) {
          payload.accessToken = googleResponse.access_token;
        }
        // console.log("SENDING PAYLOAD");
  
        const response = await axiosInstance.post(`/api/user/auth/google-auth`, payload);
        const result = response.data;
        
        dispatch(login({ token: result.token, role: result.role, user: result.user }));
        toast.success("Successfully logged in with Google!");
  
        const user = result.user;
        const isMissingDetails = !user.phone || !user.gender || !user.location || !user.sportTypes?.length;
  
        if (isMissingDetails) {
          setOnboardingData({
            authMethod: 'google',
            user
          });
          setShowOnboarding(true);
        } else {
          const teamInvite = localStorage.getItem("pendingTeamInvite");
          if (teamInvite) {
            try {
               await axiosInstance.post(`/api/team/user/join/${teamInvite}`);
               toast.success("Successfully joined the team!");
               localStorage.removeItem("pendingTeamInvite");
               const teamId = localStorage.getItem("pendingTeamId");
               if (teamId) {
                  localStorage.removeItem("pendingTeamId");
                  return navigate(`/team/${teamId}`);
               }
            } catch (err) {
               toast.error(err.response?.data?.message || "Failed to join team");
            }
          }

          const role = result.role?.toLowerCase() || "";
          if (role.includes("umpire")) navigate("/umpire");
          else navigate("/");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Google sign-in failed");
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#000] relative flex flex-col items-center justify-start pt-4 lg:pt-10 pb-12 font-sans">
      <div className="absolute inset-0 z-0 bg-black" />

      <div className={`relative z-10 w-full max-w-md mx-auto px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        <div className="flex flex-col items-center w-full mx-auto">
          <div className="w-full relative">
            
            <div className="flex flex-col items-center justify-center text-center mb-10">
               <div className="space-y-2">
                 <h2 className="text-3xl font-bold text-white">Create Account</h2>
                 <p className="text-sm text-white/60">Sign up to get started</p>
               </div>
            </div>

            <div className="w-full relative z-20">
              <div className="space-y-6">
                
                {step === 1 && (
                  <>
                    <GoogleAuthButton 
                      mode="signup"
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error("Google sign-in failed")}
                      isLoading={loading}
                    />

                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-xs text-white/40 font-medium uppercase tracking-wider">or continue with</span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>
                  </>
                )}

                <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="space-y-6">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => { setAuthMode('unified'); setStep(1); }}
                      className="text-[#55DEE8] flex items-center text-sm font-medium hover:underline mb-4"
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Back to options
                    </button>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-white/60 ml-1">
                        Phone Number
                      </label>
                      <div className="relative group/field flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-14 px-2 text-white text-sm outline-none transition-all cursor-pointer w-20 appearance-none text-center"
                        >
                          <option value="+91" className="text-black">+91 🇮🇳</option>
                          <option value="+1" className="text-black">+1 🇺🇸</option>
                          <option value="+44" className="text-black">+44 🇬🇧</option>
                          <option value="+61" className="text-black">+61 🇦🇺</option>
                          <option value="+971" className="text-black">+971 🇦🇪</option>
                        </select>
                        <div className="relative flex-1">
                          <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#55DEE8] transition-colors" />
                          <input 
                            type="tel"
                            required
                            value={identifier}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setIdentifier(val.slice(0, 10));
                            }}
                            placeholder="9876543210"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-white/60 ml-1">
                        Enter OTP sent to {authMode === 'email' ? email : phone}
                      </label>
                      <div className="relative group/field">
                        <CheckCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#55DEE8] transition-colors" />
                        <input 
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="6-digit OTP"
                          className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all tracking-[0.5em] font-mono"
                        />
                      </div>
                    </div>
                  )}



                  <div className="flex justify-center my-4">
                    <Turnstile
                      sitekey={import.meta.env.DEV ? "1x00000000000000000000AA" : import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onVerify={(token) => setTurnstileToken(token)}
                      theme="dark"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !turnstileToken}
                    className="w-full bg-[#55DEE8] hover:bg-[#a3e635] text-black h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group/btn" 
                  >
                    {loading ? "Processing..." : step === 2 ? "Complete Profile" : "Continue"}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </div>
            </div>

            <div className="pt-8 mt-10 border-t border-white/5 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-white/60">
                Already have an account? <Link to="/login" className="text-[#55DEE8] hover:underline ml-2 font-semibold">Login</Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </div>
      
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-white/[0.01] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-white/[0.01] pointer-events-none rounded-full" />
      
      {showOnboarding && (
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)}
          initialData={onboardingData}
          onComplete={async () => {
            const inviteToken = localStorage.getItem("pendingInvite");
            const teamInvite = localStorage.getItem("pendingTeamInvite");
            
            if (teamInvite) {
              try {
                 await axiosInstance.post(`/api/team/user/join/${teamInvite}`);
                 toast.success("Successfully joined the team!");
                 localStorage.removeItem("pendingTeamInvite");
                 const teamId = localStorage.getItem("pendingTeamId");
                 if (teamId) {
                    localStorage.removeItem("pendingTeamId");
                    return navigate(`/team/${teamId}`);
                 }
              } catch (err) {
                 toast.error(err.response?.data?.message || "Failed to join team");
              }
            }

            if (inviteToken) navigate(`/join-games?invite=${inviteToken}`);
            else navigate("/");
          }}
        />
      )}
    </div>
  );
};

export default SignUp;

