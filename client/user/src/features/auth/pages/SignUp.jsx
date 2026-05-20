import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Turnstile from "react-turnstile";
import OnboardingModal from "@components/modals/OnboardingModal";
import { ArrowRight, ChevronLeft, Mail, Phone, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useDispatch } from "react-redux";
import { login } from "@redux/slices/authSlice";

const SignUp = () => {
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState('initial'); // 'initial', 'email', 'phone'
  const [step, setStep] = useState(1); // 1: Input, 2: OTP, 3: Password
  
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
    const inviteToken = searchParams.get("invite");
    const umpireToken = searchParams.get("umpireInvite");

    if (inviteToken) {
      localStorage.setItem("pendingInvite", inviteToken);
      const emailParam = searchParams.get("email");
      if (emailParam) setEmail(decodeURIComponent(emailParam));
    }
    if (umpireToken) {
      localStorage.setItem("umpireInvite", umpireToken);
      const emailParam = searchParams.get("email");
      if (emailParam) setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (authMode === 'email' && !email) return toast.error("Email required");
    if (authMode === 'phone' && (!phone || phone.length < 10)) return toast.error("Valid phone number required");
    
    setLoading(true);
    try {
      const payload = authMode === 'email' ? { email } : { phone };
      const res = await axiosInstance.post('/api/user/auth/send-otp', payload);
      toast.success(res.data.message);
      if (res.data.testOtp) {
         toast(authMode === 'email' ? `Test OTP: ${res.data.testOtp.email}` : `Test OTP: ${res.data.testOtp.phone}`, { icon: '🧑‍💻', duration: 10000 });
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error("Valid 6-digit OTP required");
    setStep(3);
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
                
                {authMode === 'initial' && (
                  <>
                    <GoogleAuthButton 
                      mode="signup"
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error("Google sign-in failed")}
                      isLoading={loading}
                    />

                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-xs text-white/40 font-medium uppercase tracking-wider">or</span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>

                    <div className="space-y-4">
                      <button 
                        onClick={() => setAuthMode('email')}
                        className="group relative w-full flex items-center justify-center h-14 px-6 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#55DEE8]/40 rounded-2xl transition-all duration-500 shadow-xl"
                      >
                        <Mail className="w-5 h-5 text-white/60 mr-3 group-hover:text-[#55DEE8] transition-colors" />
                        <span className="text-sm font-bold text-white tracking-wide uppercase">Sign up with Email</span>
                      </button>

                      <button 
                        onClick={() => setAuthMode('phone')}
                        className="group relative w-full flex items-center justify-center h-14 px-6 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#55DEE8]/40 rounded-2xl transition-all duration-500 shadow-xl"
                      >
                        <Phone className="w-5 h-5 text-white/60 mr-3 group-hover:text-[#55DEE8] transition-colors" />
                        <span className="text-sm font-bold text-white tracking-wide uppercase">Switch to Phone Sign up</span>
                      </button>
                    </div>
                  </>
                )}

                {authMode !== 'initial' && (
                  <form onSubmit={step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handlePasswordSubmit} className="space-y-6">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('initial'); setStep(1); }}
                      className="text-[#55DEE8] flex items-center text-sm font-medium hover:underline mb-4"
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Back to options
                    </button>

                    {step === 1 && (
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-white/60 ml-1">
                          {authMode === 'email' ? 'Email Address' : 'Phone Number'}
                        </label>
                        <div className="relative group/field">
                          {authMode === 'email' ? (
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#55DEE8] transition-colors" />
                          ) : (
                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#55DEE8] transition-colors" />
                          )}
                          <input 
                            type={authMode === 'email' ? 'email' : 'tel'}
                            required
                            value={authMode === 'email' ? email : phone}
                            onChange={(e) => authMode === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
                            placeholder={authMode === 'email' ? 'name@example.com' : '+91 00000 00000'}
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                          />
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

                    {step === 3 && (
                      <div className="space-y-4">
                        <label className="text-sm font-medium text-white/60 ml-1">
                          Create Password
                        </label>
                        <div className="relative group/field">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#55DEE8] transition-colors" />
                          <input 
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#55DEE8]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center my-4">
                      <Turnstile
                        sitekey="0x4AAAAAAA7f_T_9-vI7yP6U"
                        onVerify={(token) => setTurnstileToken(token)}
                        theme="dark"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading || !turnstileToken}
                      className="w-full bg-[#55DEE8] hover:bg-[#a3e635] text-black h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group/btn" 
                    >
                      {loading ? "Processing..." : step === 3 ? "Complete Profile" : "Continue"}
                      {!loading && <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                    </button>
                  </form>
                )}
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
          onComplete={() => {
            const inviteToken = localStorage.getItem("pendingInvite");
            if (inviteToken) navigate(`/join-games?invite=${inviteToken}`);
            else navigate("/");
          }}
        />
      )}
    </div>
  );
};

export default SignUp;
