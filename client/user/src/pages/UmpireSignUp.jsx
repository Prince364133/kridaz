import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useSignUpForm from "@hooks/useSignUpForm";
import axiosInstance from "@hooks/useAxiosInstance";
import { GoogleLogin } from "@react-oauth/google";
import FileUpload from "../components/common/FileUpload";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  User,
  Mail,
  Phone,
  ChevronLeft,
  Building2,
  BarChart3,
  CalendarCheck,
  MapPin,
  Locate,
  UserSquare2,
  FileText,
  CreditCard,
  Image as ImageIcon,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Trophy,
  Scale,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";

const ACCENT = "#EF4444"; // Red for umpires

const UmpireSignUp = () => {
  const { 
    register, 
    handleSubmit, 
    errors, 
    onSubmit, 
    loading,
    setValue,
    getValues,
    watch,
    trigger,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
    currentStep,
    setCurrentStep,
    user,
    role,
    navigate
  } = useSignUpForm("umpire");

  const [mounted, setMounted] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [docs, setDocs] = useState([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setMounted(true);
    
    // Check for invite tokens
    const inviteToken = searchParams.get("invite") || searchParams.get("token");
    const umpireInvite = searchParams.get("umpireInvite");
    const tokenToUse = inviteToken || umpireInvite;
    const emailParam = searchParams.get("email");

    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam);
      setValue("email", decodedEmail);
    }

    if (tokenToUse) {
      localStorage.setItem("umpireInvite", tokenToUse);
      
      const fetchInviteDetails = async () => {
        try {
          const res = await axiosInstance.get(`/api/hosted-game/verify-invite?token=${tokenToUse}`);
          if (res.data.success) {
            const { name, email, phone } = res.data;
            if (name) setValue("name", name);
            if (email) setValue("email", email);
            if (phone) setValue("phone", phone);
            toast.success(`Welcome ${name || 'Umpire'}! Please complete your signup.`);
          }
        } catch (err) {
          console.error("Invite fetch error:", err);
        }
      };
      fetchInviteDetails();
    }

    // Redirect if already an umpire
    if (user?.role === "umpire" || role === "umpire") {
      navigate("/umpire");
    }
  }, [user, role, navigate]);

  const handleDocUpload = (url, name) => {
    if (!url) {
      const updatedDocs = docs.filter(d => d.name !== name);
      setDocs(updatedDocs);
      setValue("documents", updatedDocs);
    } else {
      const newDoc = { name, url };
      const updatedDocs = [...docs, newDoc];
      setDocs(updatedDocs);
      setValue("documents", updatedDocs);
    }
  };

  const nextStep = async () => {
    let fields = [];
    if (currentStep === 1) {
      fields = ["name", "username", "email", "phone", "gender", "location", "password", "confirmPassword"];
    } else if (currentStep === 2) {
      fields = [
        "businessDetails.businessName", 
        "businessDetails.address", 
        "businessDetails.registrationNumber",
        "businessDetails.experience",
        "businessDetails.specialization",
        "businessDetails.city",
        "businessDetails.state",
        "businessDetails.zipCode"
      ];
    }

    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || "";
            const state = data.address.state || "";
            const locationString = [city, state].filter(Boolean).join(", ");
            setValue("location", locationString, { shouldValidate: true });
            toast.success("Location fetched successfully");
          } else {
            toast.error("Could not determine location");
          }
        } catch (error) {
          toast.error("Error fetching location details");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        toast.error("Location access denied or unavailable");
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex flex-col items-center justify-start pt-24 lg:pt-32 pb-20 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-red-900/10" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none" />
      </div>

      <div className={`relative z-10 w-full max-w-[1300px] grid lg:grid-cols-5 gap-0 lg:gap-24 items-center px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>

        {/* Left Side */}
        <div className="hidden lg:flex lg:col-span-2 flex-col space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5">
              <Scale size={12} className="text-red-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-red-400 uppercase">Official Network</span>
            </div>
            <h1 className="text-7xl xl:text-8xl font-bold text-white leading-[0.9] tracking-tight uppercase">
              UMPIRE <br />
              <span style={{ color: ACCENT }}>OFFICIAL.</span>
            </h1>
            <p className="text-sm text-white/40 uppercase tracking-widest max-w-sm leading-relaxed">
              Join the Kridaz elite officials network. Officiate professional matches and build your career.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: Eye, title: "Precision", desc: "Expert officiating for high-stakes matches" },
              { icon: Trophy, title: "Recognition", desc: "Build your profile as a top-tier official" },
              { icon: Gavel, title: "Fair Play", desc: "Uphold the spirit of the game on every turf" }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 group cursor-default">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-red-500/10 group-hover:border-red-500/30 transition-all duration-500">
                  <item.icon size={20} className="text-red-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">{item.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-[200px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:col-span-3 w-full">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
            {/* Step Progress */}
            <div className="flex items-center justify-between mb-12 relative px-4">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -z-0" />
              {[1, 2, 3].map((step) => (
                <div 
                  key={step}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                    currentStep >= step 
                      ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]" 
                      : "bg-black border border-white/20 text-gray-500"
                  }`}
                >
                  {currentStep > step ? <CheckCircle2 size={18} /> : step}
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">
                {currentStep === 1 ? "Official Profile" : currentStep === 2 ? "Professional Details" : "Verification Documents"}
              </h2>
              <p className="text-gray-500 text-sm">Step {currentStep} of 3 • Mandatory Information</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("name")}
                      placeholder="FULL NAME"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.name.message}</p>}
                  </div>

                  <div className="md:col-span-2 relative group">
                    <UserSquare2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("username")}
                      onInput={(e) => { e.target.value = e.target.value.toLowerCase(); }}
                      placeholder="USERNAME"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.username && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.username.message}</p>}
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="EMAIL ADDRESS"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.email && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.email.message}</p>}
                  </div>

                  <div className="relative group">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("phone")}
                      placeholder="PHONE NUMBER"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.phone.message}</p>}
                  </div>

                  <div className="relative group">
                    <UserSquare2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <select
                      {...register("gender")}
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest appearance-none"
                    >
                      <option value="" className="bg-black">SELECT GENDER</option>
                      <option value="male" className="bg-black">MALE</option>
                      <option value="female" className="bg-black">FEMALE</option>
                      <option value="other" className="bg-black">OTHER</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.gender.message}</p>}
                  </div>

                  <div className="relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("location")}
                      placeholder="LOCATION"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-14 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={fetchLocation}
                      disabled={isFetchingLocation}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl transition-all text-red-400 disabled:opacity-50"
                    >
                      <Locate size={18} className={isFetchingLocation ? "animate-spin" : ""} />
                    </button>
                    {errors.location && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.location.message}</p>}
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="CREATE PASSWORD"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.password && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.password.message}</p>}
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      placeholder="CONFIRM PASSWORD"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 relative group">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.businessName")}
                      placeholder="OFFICIAL TITLE / ORGANIZATION"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.businessName && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.businessName.message}</p>}
                  </div>

                  <div className="relative group">
                    <BarChart3 className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.experience")}
                      placeholder="YEARS AS OFFICIAL"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.experience && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.experience.message}</p>}
                  </div>

                  <div className="relative group">
                    <Gavel className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.specialization")}
                      placeholder="PRIMARY SPORT (e.g. CRICKET)"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.specialization && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.specialization.message}</p>}
                  </div>

                  <div className="md:col-span-2 relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.address")}
                      placeholder="RESIDENTIAL / OFFICE ADDRESS"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.address && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.address.message}</p>}
                  </div>

                  <div className="relative group">
                    <Locate className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.city")}
                      placeholder="CITY"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.city && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.city.message}</p>}
                  </div>

                  <div className="relative group">
                    <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.state")}
                      placeholder="STATE"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.state && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.state.message}</p>}
                  </div>

                  <div className="relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.zipCode")}
                      placeholder="ZIP CODE"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.zipCode && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.zipCode.message}</p>}
                  </div>

                  <div className="relative group">
                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors" size={20} />
                    <input
                      {...register("businessDetails.registrationNumber")}
                      placeholder="UMPIRE ID / ACCREDITATION"
                      className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-2xl h-16 pl-14 pr-5 text-white outline-none transition-all uppercase text-xs font-bold tracking-widest"
                    />
                    {errors.businessDetails?.registrationNumber && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.businessDetails.registrationNumber.message}</p>}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 p-6 rounded-2xl bg-red-500/5 border border-red-500/20 mb-4">
                    <p className="text-[10px] text-red-400 uppercase font-bold tracking-[0.2em] mb-2">Official Verification</p>
                    <p className="text-xs text-gray-400 leading-relaxed">Verification is required for match eligibility. Upload your official accreditation, ID proof, and address proof.</p>
                  </div>

                  <FileUpload label="Official Accreditation" onUploadSuccess={(url) => handleDocUpload(url, "Accreditation")} />
                  <FileUpload label="Identity Proof (PAN/Aadhar)" onUploadSuccess={(url) => handleDocUpload(url, "ID Proof")} />
                  <FileUpload label="Address Proof" onUploadSuccess={(url) => handleDocUpload(url, "Address Proof")} />
                  <FileUpload label="Umpiring Log / Match History" onUploadSuccess={(url) => handleDocUpload(url, "Log")} />

                  <div className="md:col-span-2">
                    {errors.documents && <p className="text-red-500 text-[10px] mt-1 ml-2 uppercase font-bold">{errors.documents.message}</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 h-16 rounded-2xl border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] h-16 rounded-2xl bg-red-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(239,68,68,0.3)]"
                  >
                    Continue
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] h-16 rounded-2xl bg-red-600 text-white font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(239,68,68,0.3)] disabled:opacity-50"
                  >
                    {loading ? "Registering..." : "Complete Official Signup"}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10">
                    <ShieldCheck size={16} className="text-green-400" />
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Verified Officials Only</span>
               </div>
               <div className="flex items-center gap-6">
                  <Link to="/login" className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest transition-colors">Already registered?</Link>
                  <Link to="/partners" className="text-[10px] text-red-400 hover:text-red-300 uppercase font-bold tracking-widest transition-colors">Not an umpire?</Link>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UmpireSignUp;
