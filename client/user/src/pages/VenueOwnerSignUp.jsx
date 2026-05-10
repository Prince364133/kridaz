import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useSignUpForm from "@hooks/useSignUpForm";
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
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const VenueOwnerSignUp = () => {
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
    setCurrentStep
  } = useSignUpForm("owner");

  const [mounted, setMounted] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDocUpload = (url, name) => {
    if (!url) {
      // Remove doc
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
        "businessDetails.city",
        "businessDetails.state",
        "businessDetails.zipCode",
        "businessDetails.experience",
        "businessDetails.specialization"
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

  const steps = [
    { id: 1, name: "Account", icon: User },
    { id: 2, name: "Business", icon: Building2 },
    { id: 3, name: "Verification", icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex flex-col items-center justify-start pt-24 lg:pt-32 pb-20 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-lime-900/10" />
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-[#84CC16]/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className={`relative z-10 w-full max-w-[1300px] grid lg:grid-cols-5 gap-0 lg:gap-24 items-start px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        
        {/* Left Side: Info */}
        <div className="hidden lg:flex lg:col-span-2 flex-col space-y-12 sticky top-32">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#84CC16]/20 bg-[#84CC16]/5">
              <Zap size={12} className="text-[#84CC16]" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#84CC16] uppercase">Partner Program</span>
            </div>
            <h1 className="text-7xl xl:text-8xl font-bold text-white leading-[0.9] tracking-tight uppercase">
              SCALE <br />
              YOUR <br />
              <span className="text-[#84CC16]">VENUE.</span>
            </h1>
            <p className="text-sm text-white/40 uppercase tracking-widest max-w-sm leading-relaxed">
              Complete your business profile to start listing your sports facility on TurfSpot.
            </p>
          </div>

          {/* Stepper Visual */}
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={step.id} className={`flex items-center gap-6 p-6 rounded-3xl border transition-all duration-500 ${
                currentStep === step.id 
                  ? "bg-[#84CC16]/10 border-[#84CC16]/30 translate-x-4" 
                  : currentStep > step.id 
                    ? "bg-white/[0.02] border-[#84CC16]/10 opacity-60" 
                    : "bg-white/[0.01] border-white/5 opacity-40"
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  currentStep >= step.id ? "bg-[#84CC16] text-black" : "bg-white/5 text-white/20"
                }`}>
                  {currentStep > step.id ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${currentStep === step.id ? "text-[#84CC16]" : "text-white/20"}`}>Step 0{step.id}</p>
                  <p className="text-lg font-bold tracking-tight uppercase">{step.name}</p>
                </div>
                {currentStep === step.id && <ChevronRight className="ml-auto text-[#84CC16]" size={20} />}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-3">
          <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden relative shadow-2xl">

            {/* Header */}
            <div className="bg-white/[0.02] border-b border-white/5 p-8 md:p-10 flex justify-between items-center">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#84CC16]/60 uppercase">
                    {currentStep === 1 ? "Account Setup" : currentStep === 2 ? "Business Profile" : "Identity Verification"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                  {currentStep === 1 ? "Partner Registration" : currentStep === 2 ? "Business Details" : "Upload Documents"}
                </h2>
                <p className="text-xs text-white/20 uppercase tracking-widest">Step {currentStep} of 3</p>
              </div>
              <Building2 size={32} className="text-[#84CC16]/30" />
            </div>

            {/* Body */}
            <div className="p-8 md:p-14">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                
                {/* STEP 1: ACCOUNT DETAILS */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-full flex flex-col items-center justify-center mb-2">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        width="100%"
                        text="signup_with"
                      />
                    </div>

                    <div className="flex items-center gap-4 w-full my-6">
                      <div className="h-px bg-white/5 flex-1"></div>
                      <span className="text-white/10 text-[10px] font-bold tracking-[0.3em] uppercase whitespace-nowrap">OR REGISTER WITH EMAIL</span>
                      <div className="h-px bg-white/5 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Full Name</label>
                        <div className="relative">
                          <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("name")} type="text" placeholder="Your Name" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.name && <p className="text-red-400 text-xs ml-1">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Username</label>
                        <div className="relative">
                          <UserSquare2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("username")} type="text" placeholder="unique_handle" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.username && <p className="text-red-400 text-xs ml-1">{errors.username.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Email Address</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("email")} type="email" placeholder="name@business.com" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Phone Number</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("phone")} type="text" placeholder="+91 00000 00000" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.phone && <p className="text-red-400 text-xs ml-1">{errors.phone.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Gender</label>
                        <div className="relative">
                          <UserSquare2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 z-10 pointer-events-none" />
                          <select {...register("gender")} className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm appearance-none outline-none transition-all cursor-pointer" defaultValue="">
                            <option value="" disabled className="bg-black text-white/40">Select Gender</option>
                            <option value="Male" className="bg-black text-white">Male</option>
                            <option value="Female" className="bg-black text-white">Female</option>
                            <option value="Other" className="bg-black text-white">Other</option>
                          </select>
                        </div>
                        {errors.gender && <p className="text-red-400 text-xs ml-1">{errors.gender.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Location</label>
                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                            <input {...register("location")} type="text" placeholder="City, State" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                          </div>
                          <button type="button" onClick={fetchLocation} disabled={isFetchingLocation} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl h-14 px-4 flex items-center justify-center gap-2 text-white/80 transition-colors disabled:opacity-50">
                            <Locate size={14} className={isFetchingLocation ? "animate-pulse text-[#84CC16]" : ""} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Password</label>
                        <div className="relative">
                          <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("password")} type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Confirm Password</label>
                        <div className="relative">
                          <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("confirmPassword")} type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>

                    <button type="button" onClick={nextStep} className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)]">
                      Continue to Business Details <ArrowRight size={20} />
                    </button>
                  </div>
                )}

                {/* STEP 2: BUSINESS DETAILS */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                      <div className="space-y-3 md:col-span-2 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Business / Venue Name</label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("businessDetails.businessName")} type="text" placeholder="e.g. Dream Arena Sports Complex" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.businessDetails?.businessName && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.businessName.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Registration / GST Number</label>
                        <div className="relative">
                          <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("businessDetails.registrationNumber")} type="text" placeholder="GSTIN or PAN" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.businessDetails?.registrationNumber && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.registrationNumber.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Years of Operation</label>
                        <div className="relative">
                          <BarChart3 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("businessDetails.experience")} type="text" placeholder="e.g. 5 Years" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.businessDetails?.experience && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.experience.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Facility Type / Specialization</label>
                        <div className="relative">
                          <Locate size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input {...register("businessDetails.specialization")} type="text" placeholder="e.g. Multi-sport Complex" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        </div>
                        {errors.businessDetails?.specialization && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.specialization.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-2 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Full Business Address</label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-4 top-4 text-white/10" />
                          <textarea {...register("businessDetails.address")} placeholder="Complete street address with landmarks" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl min-h-[100px] p-4 pl-12 text-white text-sm placeholder:text-white/10 outline-none transition-all resize-none"></textarea>
                        </div>
                        {errors.businessDetails?.address && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.address.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">City</label>
                        <input {...register("businessDetails.city")} type="text" placeholder="City" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 px-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        {errors.businessDetails?.city && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.city.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">State</label>
                        <input {...register("businessDetails.state")} type="text" placeholder="State" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 px-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        {errors.businessDetails?.state && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.state.message}</p>}
                      </div>

                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Zip Code</label>
                        <input {...register("businessDetails.zipCode")} type="text" placeholder="Zip Code" className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 px-4 text-white text-sm placeholder:text-white/10 outline-none transition-all" />
                        {errors.businessDetails?.zipCode && <p className="text-red-400 text-xs ml-1">{errors.businessDetails.zipCode.message}</p>}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={prevStep} className="flex-1 bg-white/5 hover:bg-white/10 text-white h-16 rounded-xl font-bold uppercase tracking-wider transition-all border border-white/10">
                        Back
                      </button>
                      <button type="button" onClick={nextStep} className="flex-[2] bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)]">
                        Continue to Documents <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DOCUMENT UPLOAD */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="p-6 rounded-3xl bg-[#84CC16]/5 border border-[#84CC16]/20 flex items-start gap-4">
                      <ShieldCheck className="text-[#84CC16] shrink-0" size={24} />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white uppercase tracking-wider">Compliance Check</p>
                        <p className="text-xs text-white/40 leading-relaxed uppercase tracking-widest">Please upload clear copies of the following documents for verification. Maximum file size: 5MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FileUpload label="PAN Card" onUploadSuccess={(url) => handleDocUpload(url, "PAN Card")} />
                      <FileUpload label="Aadhaar Card" onUploadSuccess={(url) => handleDocUpload(url, "Aadhaar Card")} />
                      <FileUpload label="GST Registration" onUploadSuccess={(url) => handleDocUpload(url, "GST Registration")} />
                      <FileUpload label="Business Profile" onUploadSuccess={(url) => handleDocUpload(url, "Business Profile")} />
                      <FileUpload label="Venue Photos / Documents" onUploadSuccess={(url) => handleDocUpload(url, "Venue Documents")} />
                      <FileUpload label="GMB Profile Screenshot" onUploadSuccess={(url) => handleDocUpload(url, "GMB Screenshot")} />
                    </div>

                    {errors.documents && <p className="text-red-400 text-xs mt-4">{errors.documents.message}</p>}

                    <div className="flex gap-4 mt-10">
                      <button type="button" onClick={prevStep} className="flex-1 bg-white/5 hover:bg-white/10 text-white h-16 rounded-xl font-bold uppercase tracking-wider transition-all border border-white/10">
                        Back
                      </button>
                      <button type="submit" disabled={loading} className="flex-[2] bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)] disabled:opacity-50">
                        {loading ? "Submitting..." : "Submit Application"}
                        {!loading && <ArrowRight size={20} />}
                      </button>
                    </div>
                  </div>
                )}

              </form>

              <div className="mt-14 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-[#84CC16]/10">
                    <ShieldCheck size={20} className="text-[#84CC16]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-widest">Enterprise Grade</p>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Security & Privacy</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <Link to="/login" className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-[0.2em] transition-colors">Already registered?</Link>
                  <Link to="/partners" className="text-[10px] font-bold text-[#84CC16] hover:text-[#a3e635] uppercase tracking-[0.2em] transition-colors">Not a venue owner?</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerSignUp;
