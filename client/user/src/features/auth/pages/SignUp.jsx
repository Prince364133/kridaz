import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import OnboardingModal from "@components/modals/OnboardingModal";
import { ArrowRight, ChevronLeft, User as UserIcon, Lock, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@redux/slices/authSlice";
import { Capacitor } from "@capacitor/core";

import { useAuthModal } from "../../../context/AuthModalContext";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const SignUp = ({ isModal = false }) => {
  const { closeAuthModal, toggleView } = useAuthModal();
  const [sentOtp, setSentOtp] = useState("");
  const [mounted, setMounted] = useState(false);
  const [authMode, setAuthMode] = useState('unified'); // 'unified', 'email', 'phone'
  const [step, setStep] = useState(1); // 1: Input, 2: OTP, 3: Password
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [countryCode, setCountryCode] = useState("+91");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);  
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const role = useSelector((state) => state.auth.role);

  useEffect(() => {
    if (isLoggedIn && role === "user" && !showOnboarding) {
      if (isModal) {
        closeAuthModal();
      } else {
        const redirectUrl = localStorage.getItem("redirectAfterLogin") || "/";
        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectUrl);
      }
    }
  }, [isLoggedIn, role, navigate, showOnboarding, isModal, closeAuthModal]);

  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

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
    
    // Remove the '+' sign before sending to the backend
    const cleanCountryCode = countryCode.replace('+', '');
    const formattedPhone = cleanCountryCode + identifier;

    setPhone(formattedPhone);
    setStep(2); // Slide to next screen immediately
    
    setLoading(true);
    try {
      const payload = { phone: formattedPhone };
      const res = await axiosInstance.post('/api/user/auth/send-otp', payload);
      toast.success(res.data.message);
      if (res.data.otp) {
        setSentOtp(res.data.otp);
        if (Capacitor.isNativePlatform()) {
          toast((t) => (
            <div className="flex flex-col gap-1 p-1">
              <div className="font-bold text-sm text-black flex items-center gap-1">
                🔔 Kridaz Notification
              </div>
              <div className="text-xs text-gray-600">
                Your verification code is: <strong className="text-black text-sm">{res.data.otp}</strong>
              </div>
            </div>
          ), { position: 'top-center', duration: 8000 });
        }
      }
      setTimeLeft(60);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
      setStep(1); // Revert back if sending failed
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
      setGoogleLoading(true);
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
          if (isModal) {
            closeAuthModal();
          }
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
        setGoogleLoading(false);
      }
  };

  const content = (
      <div className={`relative z-10 w-full max-w-md mx-auto px-6 md:px-0 transition-all duration-1000 transform flex flex-col flex-1 h-full md:h-auto md:justify-center ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        <div className="flex flex-col w-full max-w-md mx-auto flex-1 md:flex-none h-full">
          <div className="w-full relative flex flex-col flex-1 md:flex-none h-full">
            
            {/* Header */}
            {step === 1 && (
              <div className="flex flex-col items-start justify-center text-left mb-8 md:mt-0 mt-4">
                 <div className="space-y-1">
                   <h2 className="text-[28px] font-bold text-white tracking-tight leading-tight font-['Inter'] uppercase">Create Account</h2>
                 </div>
              </div>
            )}

            {step > 1 && (
              <button
                type="button"
                onClick={() => { setAuthMode('unified'); setStep(1); }}
                className="absolute top-2 left-0 md:-left-4 text-[#A2F86D] flex items-center text-sm font-medium hover:underline z-50"
              >
                <ChevronLeft size={16} className="mr-1" />
                Back to options
              </button>
            )}

            <div className="w-full flex-1 flex flex-col">
              <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="flex-1 flex flex-col">
                
                {step === 1 && (
                  <div className="flex-1 flex flex-col animate-fade-in">
                    <div className="space-y-5">
                      <div>
                        <label className="text-[11px] font-semibold tracking-widest text-white/60 uppercase mb-2 block">
                          Phone Number
                        </label>
                        <div className="relative flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent focus:border-white/20 rounded-[10px] h-14 px-2 text-white text-sm outline-none transition-all cursor-pointer w-20 appearance-none text-center"
                          >
                            <option value="+91" className="text-black">+91</option>
                            <option value="+1" className="text-black">+1</option>
                            <option value="+44" className="text-black">+44</option>
                            <option value="+61" className="text-black">+61</option>
                            <option value="+971" className="text-black">+971</option>
                          </select>
                          <div className="relative flex-1">
                            <input 
                              type="tel"
                              required
                              value={identifier}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setIdentifier(val.slice(0, 10));
                              }}
                              className="w-full bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent focus:border-white/20 rounded-[10px] h-14 px-4 text-white text-sm outline-none transition-all focus:bg-white/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full my-6 md:my-8">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-white/40 text-[11px] tracking-widest font-medium uppercase">OR</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="w-full">
                      <GoogleAuthButton 
                        mode="signup"
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Google sign-in failed")}
                        isLoading={googleLoading}
                      />
                    </div>

                    <div className="mt-auto pt-8 pb-4">
                      <div className="text-center mb-6">
                        <p className="text-[14px] text-white/80">
                          Already have an account? 
                          <button 
                            type="button"
                            onClick={() => {
                              if (isModal) {
                                toggleView();
                              } else {
                                navigate("/login");
                              }
                            }} 
                            className="text-[#A2F86D] hover:underline ml-1"
                          >
                            Login
                          </button>
                        </p>
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#60E5D0] to-[#A2F86D] text-black h-[52px] rounded-xl font-medium text-[15px] flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50" 
                      >
                        {loading ? "Processing..." : "Continue"}
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex-1 flex flex-col animate-slide-left">
                    <div className="flex-1">
                      <div className="flex flex-col items-start justify-center text-left mb-8 mt-24 md:mt-40">
                        <div className="space-y-1">
                          <h3 className="text-[24px] font-bold text-white tracking-tight leading-tight font-['Inter'] uppercase">Verification Code</h3>
                          <p className="text-sm text-white/60">Enter OTP sent to {authMode === 'email' ? email : phone}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between gap-2">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={otp[index] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val && !/^\d*$/.test(val)) return;
                                const newOtp = otp.split('');
                                newOtp[index] = val.slice(-1);
                                const joined = newOtp.join('');
                                setOtp(joined);
                                if (val && index < 5) {
                                  document.getElementById(`otp-${index + 1}`)?.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                  document.getElementById(`otp-${index - 1}`)?.focus();
                                }
                              }}
                              className="w-12 h-14 bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent focus:border-white/20 rounded-[10px] text-white text-center text-xl font-bold outline-none transition-all focus:bg-white/20"
                            />
                          ))}
                        </div>
                        {!Capacitor.isNativePlatform() && sentOtp && (
                          <div className="bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent rounded-[10px] p-3 mt-4 text-center">
                            <p className="text-xs text-white/60">Developer Message</p>
                            <p className="text-sm text-[#A2F86D] font-mono mt-1">Your OTP code is: <strong>{sentOtp}</strong></p>
                          </div>
                        )}
                        
                        <div className="flex flex-col items-center mt-8 space-y-4">
                          {timeLeft > 0 ? (
                            <p className="text-white/80 text-sm">
                              You can resend the code in <span className="text-[#A2F86D]">{timeLeft}</span> seconds
                            </p>
                          ) : (
                            <p className="text-white/80 text-sm">
                              Didn't receive the code?
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={timeLeft > 0 || loading}
                            onClick={handleSendOtp}
                            className={`text-2xl font-medium transition-colors ${timeLeft > 0 ? 'text-white/40 cursor-not-allowed' : 'text-[#A2F86D] hover:text-[#b4fc87]'}`}
                          >
                            Resend Code
                          </button>
                        </div>

                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-[#60E5D0] to-[#A2F86D] text-black h-[52px] rounded-xl font-medium text-[15px] flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 mt-auto mb-4" 
                    >
                      {loading && otp.length < 6 ? "Sending OTP..." : loading ? "Verifying..." : "Verify & Sign Up"}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
        
        {!isModal && (
          <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        )}
      </div>
  );

  const handleOnboardingComplete = async () => {
    if (isModal) {
      closeAuthModal();
    }
    
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
    else if (!isModal) navigate("/");
  };

  if (isModal) {
    return (
      <>
        {content}
        {showOnboarding && (
          <OnboardingModal 
            isOpen={showOnboarding} 
            onClose={() => setShowOnboarding(false)}
            initialData={onboardingData}
            onComplete={handleOnboardingComplete}
          />
        )}
      </>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md transition-opacity duration-500 ease-in-out ${!mounted ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`relative w-full max-w-[956px] h-[100dvh] sm:h-[821px] sm:max-h-[95vh] bg-[#0d0d0d] rounded-none sm:rounded-2xl overflow-hidden flex shadow-2xl sm:border border-white/10 transition-all duration-500 ease-in-out transform ${!mounted ? 'translate-y-full opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}>
        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Left Side: Image Holder */}
        <div className="hidden md:block w-1/2 relative bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <img 
            src="/scoring_bg.png" 
            alt="Auth Background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-10 left-10 z-20 space-y-2 text-left">
            <h3 className="text-3xl font-bold text-white">Join Kridaz</h3>
            <p className="text-white/70">Connect, play, and track your sports journey.</p>
          </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full md:w-1/2 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex flex-col justify-center py-10 px-2 min-h-0">
            {content}
          </div>
        </div>
      </div>
      
      {showOnboarding && (
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)}
          initialData={onboardingData}
          onComplete={handleOnboardingComplete}
        />
      )}
    </div>
  );
};

export default SignUp;

