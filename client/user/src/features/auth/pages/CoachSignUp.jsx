import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSignUpForm from "../hooks/useSignUpForm";
import FileUpload from "@components/common/FileUpload";
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
  Dumbbell,
  Trophy,
  Users,
  BookOpen,
  Camera,
  Loader2,
  X
} from "lucide-react";
import toast from "react-hot-toast";

const CoachSignUp = () => {
  const navigate = useNavigate();
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
    currentStep,
    setCurrentStep,
    user,
    role
  } = useSignUpForm("coach");

  useEffect(() => {
    // Redirect if already a coach
    if (user?.role === "coach" || role === "coach") {
      navigate("/coach");
    }
  }, [user, role, navigate]);

  const handlePhotoUpload = (url) => {
    setValue("profilePicture", url);
  };

  const handleDocUpload = (url, name) => {
    const currentDocs = getValues("documents") || [];
    if (!url) {
      const updatedDocs = currentDocs.filter(d => d.name !== name);
      setValue("documents", updatedDocs);
    } else {
      const newDoc = { name, url };
      setValue("documents", [...currentDocs, newDoc]);
    }
  };

  const nextStep = async () => {
    let fields = [];
    if (currentStep === 1) {
      fields = [
        "name", "email", "phone", "gender", "dob", "address", "city", "state", "pinCode",
        "sportTypes", "experience", "coachingLevel", "sessionFee", 
        "availabilityTimings", "availabilityMode", "preferredLocations", "bio",
        "password", "confirmPassword"
      ];
    }

    const isValid = await trigger(fields);
    if (isValid) {
      if (currentStep === 1 && !showOtpInput) {
        handleSubmit(onSubmit)();
      } else {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-open-sans selection:bg-[#55DEE8] selection:text-black">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#55DEE8]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#55DEE8]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Left Side: Branding & Info */}
          <div className="lg:w-1/3 space-y-8 sticky top-32">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#55DEE8]/10 border border-[#55DEE8]/20 rounded-full">
                <Dumbbell size={14} className="text-[#55DEE8]" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#55DEE8] uppercase font-inter">Partner Portal</span>
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold font-inter leading-[1.1] tracking-tight">
                JOIN THE <br />
                <span className="text-[#55DEE8]">ELITE COACH</span> <br />
                NETWORK.
              </h1>
              <p className="text-[#999999] text-sm leading-relaxed font-open-sans max-w-sm">
                Scale your coaching business with Kridaz. Get verified, manage students, and automate your bookings.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              {[
                { icon: Trophy, title: "Pro Reputation", desc: "Build trust with verified reviews and badges." },
                { icon: Users, title: "Massive Reach", desc: "Connect with thousands of active players in your city." },
                { icon: Zap, title: "Instant Bookings", desc: "Seamless availability and payment settlement." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-12 h-12 flex-shrink-0 rounded-[8px] bg-[#111111] border border-[#2D2D2D] flex items-center justify-center group-hover:border-[#55DEE8]/50 transition-all">
                    <item.icon size={20} className="text-[#55DEE8]" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1 font-inter">{item.title}</h4>
                    <p className="text-[#666666] text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Multi-step Form */}
          <div className="lg:w-2/3 w-full">
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 lg:p-12 shadow-[var(--shadow-2)] relative overflow-hidden">
              
              {/* Progress Header */}
              <div className="mb-12">
                <div className="flex items-center gap-4 mb-8">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center text-[11px] font-bold transition-all ${
                        currentStep === step ? "bg-[#55DEE8] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]" : 
                        currentStep > step ? "bg-[#2D2D2D] text-[#55DEE8]" : "bg-[#111111] border border-[#2D2D2D] text-[#444]"
                      }`}>
                        {currentStep > step ? <CheckCircle2 size={16} /> : step}
                      </div>
                      {step < 3 && <div className="w-8 h-[1px] bg-[#2D2D2D]" />}
                    </div>
                  ))}
                </div>
                <h2 className="text-3xl font-bold text-white uppercase tracking-tight font-inter">
                  {currentStep === 1 ? "Registration Details" : currentStep === 2 ? "Professional Docs" : "Final Verification"}
                </h2>
                <p className="text-[#878C9F] text-xs mt-1 uppercase tracking-widest font-inter">Step {currentStep} of 3 G求 {currentStep === 1 ? "Basic Information" : "Documents & KYC"}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {currentStep === 1 && (
                  <div className="space-y-10 animate-fade-in">
                    
                    {/* Profile Photo Section */}
                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-[#111111] border border-[#2D2D2D] rounded-[8px]">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[8px] border-2 border-[#2D2D2D] bg-[#000000] overflow-hidden flex items-center justify-center">
                          {watch("profilePicture") ? (
                            <img src={watch("profilePicture")} className="w-full h-full object-cover" alt="Profile" />
                          ) : (
                            <User size={48} className="text-[#2D2D2D]" />
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[8px]">
                          <Camera size={24} className="text-[#55DEE8]" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              toast.promise(
                                Promise.resolve("https://ui-avatars.com/api/?name=Coach"), // Placeholder for actual upload
                                { loading: 'Uploading...', success: 'Photo uploaded!', error: 'Upload failed.' }
                              ).then(url => handlePhotoUpload(url));
                            }
                          }} />
                        </label>
                      </div>
                      <div className="space-y-1 text-center md:text-left">
                        <h4 className="text-[13px] font-bold text-white uppercase font-inter">Profile Photo</h4>
                        <p className="text-[11px] text-[#666666]">Upload a professional headshot for your public profile. (Max 2MB)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Full Name</label>
                        <input {...register("name")} placeholder="John Doe" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.name.message}</p>}
                      </div>

                      {/* Mobile Number */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Mobile Number</label>
                        <div className="relative">
                          <input {...register("phone")} placeholder="9876543210" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#55DEE8] uppercase hover:underline">Verify</button>
                        </div>
                        {errors.phone && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.phone.message}</p>}
                      </div>

                      {/* Email Address */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Email Address</label>
                        <input {...register("email")} placeholder="coach@kridaz.com" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.email.message}</p>}
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Date of Birth</label>
                        <input {...register("dob")} type="date" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans color-scheme-dark" />
                        {errors.dob && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.dob.message}</p>}
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Gender</label>
                        <select {...register("gender")} className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.gender && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.gender.message}</p>}
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Street Address</label>
                        <input {...register("address")} placeholder="123 Sports Complex Road" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.address && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.address.message}</p>}
                      </div>

                      {/* City, State, PIN */}
                      <div className="grid grid-cols-3 gap-4 md:col-span-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">City</label>
                          <input {...register("city")} placeholder="Mumbai" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">State</label>
                          <input {...register("state")} placeholder="MH" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">PIN Code</label>
                          <input {...register("pinCode")} placeholder="400001" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        </div>
                      </div>

                      {/* Sport Expertise */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Sport Expertise</label>
                        <input placeholder="e.g. Cricket, Football" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val) {
                              const current = getValues("sportTypes") || [];
                              if (!current.includes(val)) setValue("sportTypes", [...current, val]);
                              e.target.value = '';
                            }
                          }
                        }} />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(watch("sportTypes") || []).map(sport => (
                            <span key={sport} className="px-2 py-1 bg-[#2D2D2D] rounded-[4px] text-[10px] font-bold flex items-center gap-2">
                              {sport}
                              <button type="button" onClick={() => setValue("sportTypes", watch("sportTypes").filter(s => s !== sport))}><X size={10} /></button>
                            </span>
                          ))}
                        </div>
                        {errors.sportTypes && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.sportTypes.message}</p>}
                      </div>

                      {/* Years of Experience */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Years of Experience</label>
                        <input {...register("experience")} placeholder="e.g. 5 Years" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.experience && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.experience.message}</p>}
                      </div>

                      {/* Coaching Level */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Coaching Level</label>
                        <select {...register("coachingLevel")} className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans">
                          <option value="Beginner">Beginner / Grassroots</option>
                          <option value="Intermediate">Intermediate / Club</option>
                          <option value="Elite">Elite / Professional</option>
                        </select>
                      </div>

                      {/* Session Fee */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Session Fee (G棣)</label>
                        <input {...register("sessionFee")} type="number" placeholder="500" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.sessionFee && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.sessionFee.message}</p>}
                      </div>

                      {/* Availability Timings */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Availability Timings</label>
                        <input {...register("availabilityTimings")} placeholder="e.g. Mon-Fri: 6AM-9AM, Weekends: Full Day" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.availabilityTimings && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.availabilityTimings.message}</p>}
                      </div>

                      {/* Availability Mode */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Availability Mode</label>
                        <select {...register("availabilityMode")} className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans">
                          <option value="Offline">Offline / On-field</option>
                          <option value="Online">Online / Remote</option>
                          <option value="Both">Both (Online & Offline)</option>
                        </select>
                      </div>

                      {/* Preferred Training Locations */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Preferred Locations</label>
                        <input {...register("preferredLocations")} placeholder="e.g. Bandra, Juhu, Andheri" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.preferredLocations && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.preferredLocations.message}</p>}
                      </div>

                      {/* Bio / About */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Bio / About Yourself</label>
                        <textarea {...register("bio")} rows={4} placeholder="Describe your coaching philosophy and career..." className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans resize-none" />
                        {errors.bio && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.bio.message}</p>}
                      </div>

                      {/* Password Section */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Password</label>
                        <input {...register("password")} type="password" placeholder="G求G求G求G求G求G求G求G求" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.password && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.password.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-wider ml-1 font-inter">Confirm Password</label>
                        <input {...register("confirmPassword")} type="password" placeholder="G求G求G求G求G求G求G求G求" className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[6px] px-4 py-3.5 text-[13px] text-white focus:border-[#55DEE8] outline-none transition-all font-open-sans" />
                        {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>

                    {/* OTP Section (Only if triggered) */}
                    {showOtpInput && (
                      <div className="p-6 bg-[#55DEE8]/5 border border-[#55DEE8]/20 rounded-[8px] space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="text-[#55DEE8]" size={20} />
                          <h4 className="text-[13px] font-bold uppercase tracking-wider font-inter">Verify Identity</h4>
                        </div>
                        <p className="text-[11px] text-[#878C9F]">Enter the 6-digit OTP sent to your registered email.</p>
                        <input {...register("otp")} placeholder="000000" className="w-full bg-[#000000] border border-[#55DEE8]/40 rounded-[6px] px-4 py-3.5 text-center text-2xl font-bold tracking-[1em] text-[#55DEE8] outline-none focus:border-[#55DEE8] transition-all font-inter" />
                        {errors.otp && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 text-center">{errors.otp.message}</p>}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="p-6 rounded-[8px] bg-[#55DEE8]/5 border border-[#55DEE8]/10">
                      <p className="text-[10px] text-[#55DEE8] uppercase font-bold tracking-[0.2em] mb-2 font-inter">Verification Protocol</p>
                      <p className="text-[12px] text-[#878C9F] leading-relaxed">Please upload your professional credentials. All documents are encrypted and reviewed by our verification team.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FileUpload label="Coaching Certificate" onUploadSuccess={(url) => handleDocUpload(url, "Certification")} />
                      <FileUpload label="Identity Proof (Aadhar/PAN)" onUploadSuccess={(url) => handleDocUpload(url, "ID Proof")} />
                      <FileUpload label="Address Proof (Bill/Statement)" onUploadSuccess={(url) => handleDocUpload(url, "Address Proof")} />
                      <FileUpload label="Sports Achievements" onUploadSuccess={(url) => handleDocUpload(url, "Achievements")} />
                    </div>
                    {errors.documents && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{errors.documents.message}</p>}
                  </div>
                )}

                <div className="flex gap-4 pt-10">
                  {currentStep > 1 && (
                    <button type="button" onClick={prevStep} className="flex-1 h-14 rounded-[6px] border border-[#2D2D2D] text-[#878C9F] font-bold uppercase tracking-widest text-[11px] hover:text-white transition-all flex items-center justify-center gap-2 font-inter">
                      <ChevronLeft size={16} /> Back
                    </button>
                  )}
                  
                  <button type="button" onClick={nextStep} disabled={loading} className="flex-[2] h-14 rounded-[6px] bg-[#55DEE8] text-black font-bold uppercase tracking-widest text-[11px] hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(204,255,0,0.2)] disabled:opacity-50 font-inter">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : (currentStep === 1 && !showOtpInput) ? "Send OTP & Continue" : currentStep < 3 ? "Next Step" : "Submit Application"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>

              <div className="mt-10 pt-10 border-t border-[#2D2D2D] flex flex-col sm:flex-row items-center justify-between gap-6">
                <Link to="/login" className="text-[10px] text-[#666666] hover:text-[#55DEE8] uppercase font-bold tracking-widest transition-colors font-inter">Already a partner? Login</Link>
                <div className="flex items-center gap-2 text-[#444]">
                  <Globe size={14} />
                  <span className="text-[10px] uppercase font-bold tracking-widest font-inter">Global Talent Network</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachSignUp;
