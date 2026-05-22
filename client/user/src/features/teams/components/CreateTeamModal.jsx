/* eslint-disable react/prop-types */
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Loader2,
  Map,
  MapPin,
  Shield,
  Sparkles,
  Upload,
  Users,
  X
} from 'lucide-react';
import { useCreateTeamMutation } from '@redux/api/teamApi';
import { useUploadFileMutation } from '@redux/api/uploadApi';

const STATE_CITIES_MAP = {
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Thane'],
  Karnataka: ['Bengaluru', 'Mysore', 'Hubli', 'Mangalore'],
  Delhi: ['New Delhi', 'Noida', 'Gurgaon', 'Faridabad'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy'],
  Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar']
};

const GRADIENT = 'linear-gradient(90deg, #3ec6c1 0%, #8bc34a 100%)';
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const BODY_STYLE = { fontFamily: "'Inter', sans-serif" };

const initialFormData = {
  name: '',
  description: '',
  sport: 'CRICKET',
  state: '',
  city: '',
  captainName: '',
  captainPhone: '',
  image: ''
};

const stepVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 48 : -48
  }),
  center: {
    opacity: 1,
    x: 0
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -48 : 48
  })
};

const FieldLabel = ({ children, right }) => (
  <div className="flex items-center justify-between px-1">
    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45" style={BODY_STYLE}>
      {children}
    </label>
    {right}
  </div>
);

const InputShell = ({ icon: Icon, children }) => (
  <div className="group relative">
    {Icon && (
      <Icon
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/[0.22] transition-colors duration-[250ms] group-focus-within:text-[#3ec6c1]"
      />
    )}
    {children}
  </div>
);

const fieldClass =
  'h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] text-sm font-semibold text-white outline-none transition-all duration-[250ms] placeholder:text-white/25 focus:border-[#3ec6c1]/60 focus:bg-white/[0.055] focus:shadow-[0_0_22px_rgba(62,198,193,0.12)]';

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [citiesList, setCitiesList] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  const canGoNext = Boolean(formData.name.trim() && formData.sport && formData.state && formData.city);
  const isBusy = isCreating || isUploading || isGeneratingLogo;
  const descriptionCount = formData.description.length;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const cities = STATE_CITIES_MAP[selectedState] || [];

    setCitiesList(cities);
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: ''
    }));
  };

  const resetModal = () => {
    setStep(1);
    setDirection(1);
    setPreview(null);
    setIsGeneratingLogo(false);
    setCitiesList([]);
    setFormData(initialFormData);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const uploadFileHelper = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    try {
      const response = await uploadFile(file).unwrap();
      if (response.success) {
        setFormData((prev) => ({ ...prev, image: response.url }));
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload logo');
      setPreview(null);
    }
  };

  const handleFileChange = async (e) => {
    await uploadFileHelper(e.target.files[0]);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    await uploadFileHelper(e.dataTransfer.files[0]);
  };

  const generateRandomLogo = async () => {
    const teamName = formData.name.trim();
    if (!teamName) {
      toast.error('Enter a team name first');
      return;
    }

    setIsGeneratingLogo(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      const initials = teamName
        .split(/\s+/)
        .slice(0, 3)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
      const accentSets = [
        ['#3ec6c1', '#8bc34a'],
        ['#35bfb9', '#94c94f'],
        ['#46d2cb', '#7eb83f'],
        ['#2fb3ae', '#a0d65a']
      ];
      const [accentA, accentB] = accentSets[Math.floor(Math.random() * accentSets.length)];
      const bgGlowX = 360;
      const bgGlowY = 360;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const glow = ctx.createRadialGradient(bgGlowX, bgGlowY, 30, bgGlowX, bgGlowY, 420);
      glow.addColorStop(0, `${accentA}55`);
      glow.addColorStop(0.35, `${accentB}22`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(360, 360);
      ctx.beginPath();
      ctx.moveTo(0, -260);
      ctx.lineTo(210, -120);
      ctx.lineTo(175, 170);
      ctx.lineTo(0, 275);
      ctx.lineTo(-175, 170);
      ctx.lineTo(-210, -120);
      ctx.closePath();
      ctx.fillStyle = 'rgba(12,12,14,0.96)';
      ctx.fill();

      const borderGradient = ctx.createLinearGradient(-230, -230, 230, 230);
      borderGradient.addColorStop(0, accentA);
      borderGradient.addColorStop(1, accentB);
      ctx.lineWidth = 16;
      ctx.strokeStyle = borderGradient;
      ctx.shadowColor = accentA;
      ctx.shadowBlur = 22;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 2;
      for (let line = -260; line <= 260; line += 28) {
        ctx.beginPath();
        ctx.moveTo(-240, line);
        ctx.lineTo(240, line + 70);
        ctx.stroke();
      }

      ctx.shadowColor = accentA;
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 148px "Open Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials || 'K', 0, -22);

      ctx.shadowBlur = 0;
      ctx.fillStyle = borderGradient;
      ctx.font = '900 30px "Inter", sans-serif';
      ctx.fillText(formData.sport || 'TEAM', 0, 128);
      ctx.restore();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Logo generation failed');

      const safeName = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'team';
      const file = new File([blob], `${safeName}-generated-logo.png`, { type: 'image/png' });
      await uploadFileHelper(file);
      toast.success('Random logo generated');
    } catch (err) {
      toast.error('Failed to generate logo');
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  const goNext = () => {
    if (!canGoNext || isBusy) return;
    setDirection(1);
    setStep(2);
  };

  const goBack = () => {
    if (isBusy) return;
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canGoNext) {
      toast.error('Complete basic team information first');
      setDirection(-1);
      setStep(1);
      return;
    }

    try {
      const response = await createTeam({
        ...formData,
        type: 'MY_TEAM'
      }).unwrap();

      toast.success('Team created successfully!');
      if (onSuccess) onSuccess(response.team);
      onClose();
      resetModal();
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create team');
    }
  };

  return (
    <AnimatePresence onExitComplete={resetModal}>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#050505] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-lg"
          />
          <div className="pointer-events-none fixed -left-24 top-12 h-64 w-64 rounded-full bg-[#3ec6c1]/12 blur-[90px]" />
          <div className="pointer-events-none fixed -right-24 bottom-10 h-72 w-72 rounded-full bg-[#8bc34a]/10 blur-[95px]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 18 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 my-4 w-full max-w-lg overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0b0c]/82 shadow-[0_0_55px_rgba(62,198,193,0.16),0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            style={{ maxWidth: 520 }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-[28px]"
              style={{
                padding: 1,
                background: GRADIENT,
                opacity: 0.32,
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude'
              }}
            />
            <div className="relative z-10 border-b border-white/[0.06] bg-white/[0.025] px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-black uppercase tracking-tight text-white" style={HEADING_STYLE}>
                    {step === 1 ? 'CREATE TEAM' : 'TEAM DETAILS'}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-white/45" style={BODY_STYLE}>
                    {step === 1 ? 'Build your squad and compete with others' : 'Add more information about your squad'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isBusy}
                  className="relative h-11 w-11 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] text-white/[0.42] shadow-[0_0_18px_rgba(62,198,193,0.08)] transition-all duration-[250ms] hover:scale-105 hover:border-[#3ec6c1]/35 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Close create team modal"
                >
                  <X size={19} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: GRADIENT }}
                    animate={{ width: step === 1 ? '50%' : '92%' }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-white/45" style={BODY_STYLE}>
                  Step {step} of 2
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 px-6 py-5 sm:px-7">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 1 ? (
                  <motion.div
                    key="create-team-step"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="min-h-[410px] space-y-4"
                  >
                    <div className="space-y-2">
                      <FieldLabel
                        right={formData.name.trim() ? (
                          <button
                            type="button"
                            onClick={generateRandomLogo}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#3ec6c1]/20 bg-[#3ec6c1]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#8bc34a] transition-all duration-[250ms] hover:scale-105 hover:border-[#8bc34a]/40 hover:bg-[#8bc34a]/10 disabled:cursor-not-allowed disabled:opacity-40"
                            style={BODY_STYLE}
                          >
                            {isGeneratingLogo ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            Generate Logo
                          </button>
                        ) : null}
                      >
                        Upload Team Logo
                      </FieldLabel>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`group relative flex h-32 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-white/[0.025] text-center transition-all duration-[250ms] hover:scale-[1.01] hover:bg-white/[0.04] ${
                          isDragging
                            ? 'border-[#3ec6c1] shadow-[0_0_28px_rgba(62,198,193,0.18)]'
                            : 'border-white/[0.12] shadow-[inset_0_0_24px_rgba(255,255,255,0.015)] hover:border-[#3ec6c1]/55 hover:shadow-[0_0_26px_rgba(62,198,193,0.11)]'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        {preview ? (
                          <img src={preview} alt="Team logo preview" className="h-full w-full object-contain p-3" />
                        ) : isUploading || isGeneratingLogo ? (
                          <>
                            <Loader2 size={24} className="animate-spin text-[#3ec6c1]" />
                            <span className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/75" style={BODY_STYLE}>
                              {isGeneratingLogo ? 'Generating Logo' : 'Uploading Logo'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="relative h-11 w-11 rounded-full bg-white/[0.06] text-white/45 transition-all duration-[250ms] group-hover:bg-[#3ec6c1]/12 group-hover:text-[#3ec6c1]">
                              <Upload size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </span>
                            <span className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-white/78" style={BODY_STYLE}>
                              Upload Team Logo
                            </span>
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30" style={BODY_STYLE}>
                              PNG, JPG up to 5MB
                            </span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel
                          right={<span className="text-[10px] font-bold text-white/28" style={BODY_STYLE}>{formData.name.length} / 30</span>}
                        >
                          Team Name
                        </FieldLabel>
                        <InputShell icon={Users}>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={30}
                            placeholder="e.g. Royal Strikers"
                            className={`${fieldClass} pl-11 pr-4`}
                            style={BODY_STYLE}
                            required
                          />
                        </InputShell>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel>Sport</FieldLabel>
                        <InputShell>
                          <select
                            name="sport"
                            value={formData.sport}
                            onChange={handleChange}
                            className={`${fieldClass} appearance-none px-4 pr-11`}
                            style={BODY_STYLE}
                            required
                          >
                            <option value="CRICKET">Cricket</option>
                            <option value="FOOTBALL">Football</option>
                            <option value="BADMINTON">Badminton</option>
                            <option value="VOLLEYBALL">Volleyball</option>
                            <option value="BASKETBALL">Basketball</option>
                            <option value="ESPORTS">Esports</option>
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
                        </InputShell>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel>State</FieldLabel>
                        <InputShell icon={Map}>
                          <select
                            name="state"
                            value={formData.state}
                            onChange={handleStateChange}
                            className={`${fieldClass} appearance-none pl-11 pr-11`}
                            style={BODY_STYLE}
                            required
                          >
                            <option value="">Select State</option>
                            {Object.keys(STATE_CITIES_MAP).map((state) => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
                        </InputShell>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel>City</FieldLabel>
                        <InputShell icon={MapPin}>
                          <select
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            disabled={!formData.state}
                            className={`${fieldClass} appearance-none pl-11 pr-11 disabled:cursor-not-allowed disabled:opacity-45`}
                            style={BODY_STYLE}
                            required
                          >
                            <option value="">Select City</option>
                            {citiesList.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
                        </InputShell>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isBusy}
                        className="h-12 flex-1 rounded-full border border-white/[0.08] bg-white/[0.035] text-sm font-bold text-white/62 transition-all duration-[250ms] hover:scale-[1.01] hover:border-white/15 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        style={BODY_STYLE}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!canGoNext || isBusy}
                        className="flex h-12 min-w-0 flex-[1.6] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-black uppercase tracking-[0.08em] text-black shadow-[0_0_24px_rgba(62,198,193,0.16)] transition-all duration-[250ms] hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(139,195,74,0.2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:gap-2 sm:text-sm sm:tracking-[0.14em]"
                        style={{ background: GRADIENT, ...BODY_STYLE }}
                      >
                        <span className="whitespace-nowrap leading-none">Next</span>
                        <ArrowRight size={17} className="shrink-0" />
                      </button>
                    </div>

                  </motion.div>
                ) : (
                  <motion.div
                    key="team-details-step"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="min-h-[410px] space-y-4"
                  >
                    <div className="space-y-2">
                      <FieldLabel
                        right={<span className="text-[10px] font-bold text-white/28" style={BODY_STYLE}>{descriptionCount} / 200</span>}
                      >
                        Description
                      </FieldLabel>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={200}
                        rows={5}
                        placeholder="Tell something about your team, playstyle, achievements, or goals..."
                        className="min-h-[128px] w-full resize-none rounded-3xl border border-white/[0.08] bg-white/[0.035] px-4 py-4 text-sm font-semibold leading-relaxed text-white outline-none transition-all duration-[250ms] placeholder:text-white/25 focus:border-[#3ec6c1]/60 focus:bg-white/[0.055] focus:shadow-[0_0_22px_rgba(62,198,193,0.12)]"
                        style={BODY_STYLE}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel>Captain Name</FieldLabel>
                        <InputShell icon={Shield}>
                          <input
                            name="captainName"
                            value={formData.captainName}
                            onChange={handleChange}
                            placeholder="Name"
                            className={`${fieldClass} pl-11 pr-4`}
                            style={BODY_STYLE}
                          />
                        </InputShell>
                      </div>

                      <div className="space-y-2">
                        <FieldLabel>Captain Phone (Optional)</FieldLabel>
                        <InputShell>
                          <input
                            name="captainPhone"
                            value={formData.captainPhone}
                            onChange={handleChange}
                            inputMode="tel"
                            placeholder="Phone number"
                            className={`${fieldClass} px-4`}
                            style={BODY_STYLE}
                          />
                        </InputShell>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={goBack}
                        disabled={isBusy}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] text-sm font-bold text-white/62 transition-all duration-[250ms] hover:scale-[1.01] hover:border-white/15 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        style={BODY_STYLE}
                      >
                        <ArrowLeft size={16} /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={!canGoNext || isBusy}
                        className="flex h-12 min-w-0 flex-[1.7] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-black uppercase tracking-[0.07em] text-black shadow-[0_0_24px_rgba(62,198,193,0.16)] transition-all duration-[250ms] hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(139,195,74,0.2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:gap-2 sm:text-sm sm:tracking-[0.12em]"
                        style={{ background: GRADIENT, ...BODY_STYLE }}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 size={17} className="shrink-0 animate-spin" />
                            <span className="whitespace-nowrap leading-none">Creating</span>
                          </>
                        ) : (
                          <span className="whitespace-nowrap leading-none">Create Team</span>
                        )}
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTeamModal;
