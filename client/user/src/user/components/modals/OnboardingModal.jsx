import { useState } from "react";
import { Check, Trophy, Activity, Zap, Target } from "lucide-react";
import axiosInstance from "../../hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { updateUser } from "../../redux/slices/authSlice";

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const dispatch = useDispatch();
  const [selectedSports, setSelectedSports] = useState([]);
  const [loading, setLoading] = useState(false);

  const sports = [
    { name: "Cricket", icon: <Trophy size={20} /> },
    { name: "Football", icon: <Activity size={20} /> },
    { name: "Badminton", icon: <Zap size={20} /> },
    { name: "Tennis", icon: <Target size={20} /> },
    { name: "Basketball", icon: <Activity size={20} /> },
    { name: "Volleyball", icon: <Zap size={20} /> },
    { name: "Table Tennis", icon: <Target size={20} /> }
  ];

  const toggleSport = (sportName) => {
    if (selectedSports.includes(sportName)) {
      setSelectedSports(selectedSports.filter(s => s !== sportName));
    } else {
      setSelectedSports([...selectedSports, sportName]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSports.length === 0) {
      toast.error("Please select at least one sport");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/user/auth/update-interests", { sportTypes: selectedSports });
      if (res.data.success) {
        dispatch(updateUser({ sportTypes: selectedSports }));
      }
      toast.success("Interests saved!");
      onComplete();
      onClose();
    } catch (error) {
      toast.error("Failed to save interests");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Select Your Games</h2>
            <p className="text-white/40 text-sm md:text-base">Tell us what you love to play to customize your experience.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-4">
            {sports.map((sport) => (
              <button
                key={sport.name}
                onClick={() => toggleSport(sport.name)}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                  selectedSports.includes(sport.name)
                    ? "bg-[#84CC16]/10 border-[#84CC16] text-[#84CC16]"
                    : "bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.05] hover:border-white/10"
                }`}
              >
                <div className={`${selectedSports.includes(sport.name) ? "text-[#84CC16]" : "text-white/20"}`}>
                  {sport.icon}
                </div>
                <span className="font-bold text-xs md:text-sm uppercase tracking-widest flex-1 text-left">{sport.name}</span>
                {selectedSports.includes(sport.name) && (
                  <Check size={16} className="text-[#84CC16]" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || selectedSports.length === 0}
            className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-14 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
          >
            {loading ? "SAVING..." : "START PLAYING"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
