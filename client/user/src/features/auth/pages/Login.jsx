import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice";
import useLoginForm from "../hooks/useLoginForm";
import GoogleAuthButton from "../components/GoogleAuthButton";
import OnboardingModal from "@components/modals/OnboardingModal";
import { Capacitor } from "@capacitor/core";
import { 
  ArrowRight,
  X
} from "lucide-react";
import { auth } from "../../../config/firebase";
import { RecaptchaVerifier } from "firebase/auth";

import { useAuthModal } from "../../../context/AuthModalContext";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const Login = ({ isModal = false }) => {
  const navigate = useNavigate();
  const { closeAuthModal, toggleView } = useAuthModal();
  const { 
    register, 
    handleSubmit, 
    errors, 
    onSubmit, 
    loading,
    showOtpInput,
    sentOtp,
    handleGoogleSuccess,
    handleGoogleError,
    showOnboarding,
    setShowOnboarding,
    onboardingUser,
    accountNotFound,
    googleLoading,
    timeLeft,
    handleSendOtp
  } = useLoginForm();
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();

  const { isLoggedIn, role } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);

    if (isLoggedIn && !showOnboarding) {
      if (isModal) {
        closeAuthModal();
      }

      const normalizedRole = role?.toLowerCase();
      const professionalRoles = ["coach", "umpire", "streamer", "scorer", "cheerleader", "commentator"];
      
      if (normalizedRole === "admin" || normalizedRole === "bmsp_admin") {
        dispatch(logout());
        toast.error("Administrators must log in via the Platform Admin Console.");
      } else if (normalizedRole === "venu_owners" || normalizedRole === "owner" || normalizedRole === "venue_owner") {
        navigate("/venue-owner");
      } else if (professionalRoles.includes(normalizedRole)) {
        navigate(`/professional/${normalizedRole}`);
      } else {
        navigate("/");
      }
    }
  }, [isLoggedIn, role, navigate, showOnboarding, dispatch, isModal, closeAuthModal]);

  const content = (
    <div className={`relative z-10 w-full max-w-md mx-auto px-6 md:px-0 transition-all duration-1000 transform flex flex-col flex-1 h-full md:h-auto md:justify-center ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        
        <div className="flex flex-col w-full max-w-md mx-auto flex-1 md:flex-none h-full">
          <div className="w-full relative flex flex-col flex-1 md:flex-none h-full">
            
            {/* Header */}
            <div className="flex flex-col items-start justify-center text-left mb-8 md:mt-0 mt-4">
               <div className="space-y-1">
                 <h2 className="text-[28px] font-bold text-white tracking-tight leading-tight font-['Inter']">Welcome back</h2>
               </div>
            </div>

            {/* Body */}
            <div className="w-full flex-1 flex flex-col">
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
                
                {/* OTP Step */}
                <div className={showOtpInput ? "space-y-6 flex-1 flex flex-col animate-fade-in" : "hidden"}>
                  <div className="flex flex-col items-start justify-center text-left mb-8 mt-24 md:mt-40">
                    <div className="space-y-1">
                      <h3 className="text-[24px] font-bold text-white tracking-tight leading-tight font-['Inter'] uppercase">Verification Code</h3>
                      <p className="text-sm text-white/60">We sent a 6-digit code to your email address.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 group/field">
                    <div className="relative">
                      <input 
                        {...register("otp")}
                        type="text" 
                        placeholder="000000"
                        maxLength={6}
                        className="w-full bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent focus:border-white/20 rounded-[10px] h-14 px-4 text-white text-center tracking-[0.5em] font-mono text-lg outline-none transition-all focus:bg-white/20"
                      />
                    </div>
                    {errors.otp && <p className="text-xs text-red-500 mt-1 ml-1 text-center">{errors.otp.message}</p>}
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
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#60E5D0] to-[#A2F86D] text-black h-[60px] rounded-xl font-semibold text-[24px] sm:text-[28px] font-['Inter'] flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 mt-auto mb-4" 
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                </div>

                {/* Email/Password Step */}
                <div className={!showOtpInput ? "flex-1 flex flex-col animate-fade-in" : "hidden"}>
                    
                    <div className="space-y-5">
                      {/* Email Input */}
                      <div>
                        <label className="text-[11px] font-semibold tracking-widest text-white/60 uppercase mb-2 block">
                          Email or Phone No
                        </label>
                        <input
                          {...register("email")}
                          type="text"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d+$/.test(val)) {
                              e.target.value = val.slice(0, 10);
                            }
                            register("email").onChange(e);
                          }}
                          className="w-full bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent focus:border-white/20 rounded-[10px] h-14 px-4 text-white text-sm outline-none transition-all focus:bg-white/20"
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
                      </div>

                      {/* Password Input */}
                      <div>
                        <label className="text-[11px] font-semibold tracking-widest text-white/60 uppercase mb-2 block">
                          Password
                        </label>
                        <input
                          {...register("password")}
                          type="password"
                          className="w-full bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent focus:border-white/20 rounded-[10px] h-14 px-4 text-white text-sm tracking-widest outline-none transition-all focus:bg-white/20"
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full my-6 md:my-8">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-white/40 text-[11px] tracking-widest font-medium uppercase">OR</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    {/* Google Login Button */}
                    <div className="w-full">
                      <GoogleAuthButton 
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        isLoading={googleLoading}
                        mode="signin"
                      />
                    </div>

                    {/* Submit Button & Sign Up Link */}
                    <div className="mt-auto pt-8 pb-4">
                      {accountNotFound && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 animate-fade-in">
                          <p className="text-sm text-red-500 text-center mb-3 font-medium">
                            Account not found. Create a new account to get started!
                          </p>
                          <Link 
                            to="/signup" 
                            className="w-full bg-white/10 hover:bg-white/20 text-white h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                          >
                            Sign Up Now <ArrowRight size={16} />
                          </Link>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <p className="text-[14px] text-white/80">
                          Dont have an account? 
                          <button 
                            type="button" 
                            onClick={() => {
                              if (isModal) {
                                toggleView();
                              } else {
                                navigate("/signup");
                              }
                            }} 
                            className="text-[#A2F86D] hover:underline ml-1"
                          >
                            Sign up
                          </button>
                        </p>
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#60E5D0] to-[#A2F86D] text-black h-[52px] rounded-xl font-medium text-[15px] flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50" 
                      >
                        {loading ? "Sending OTP..." : "Continue"}
                      </button>
                    </div>
                  </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  );

  if (isModal) {
    return (
      <>
        {content}
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
          onComplete={() => navigate("/")}
        />
        <div id="recaptcha-container"></div>
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
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={() => navigate("/")}
      />
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;

