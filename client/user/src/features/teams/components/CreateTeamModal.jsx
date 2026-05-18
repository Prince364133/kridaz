import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Upload, Sparkles, Loader2, Info } from 'lucide-react';
import { useCreateTeamMutation } from '@redux/api/teamApi';
import toast from 'react-hot-toast';

const CITIES = ['Haldwani', 'Lalkuan', 'Nainital', 'Rampur', 'Rudrapur', 'Dehradun', 'Delhi', 'Noida', 'Gurugram'];
const SPORT_TYPES = ['CRICKET', 'FOOTBALL', 'BASKETBALL', 'BADMINTON', 'VOLLEYBALL', 'TENNIS'];

const CreateTeamModal = ({ isOpen, onClose }) => {
  const [createTeam, { isLoading }] = useCreateTeamMutation();
  const [formData, setFormData] = useState({
    name: '',
    sportType: 'CRICKET',
    city: 'Haldwani',
    description: '',
    captainName: '',
    captainContact: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Team Name is required');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      if (imageFile) {
        data.append('image', imageFile);
      }

      const result = await createTeam(data).unwrap();
      if (result.success) {
        toast.success('Team created successfully!');
        onClose();
        resetForm();
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create team');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sportType: 'CRICKET',
      city: 'Haldwani',
      description: '',
      captainName: '',
      captainContact: '',
    });
    setImagePreview(null);
    setImageFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00]">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Create New Squad</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Form your ultimate sports team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-white/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Top Row: Logo & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.01] hover:bg-white/[0.02] hover:border-[#CCFF00]/30 transition-all group relative cursor-pointer">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10">
                  <img src={imagePreview} alt="Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={16} className="text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-[#CCFF00] group-hover:border-[#CCFF00]/30 transition-all mb-3">
                    <Upload size={20} />
                  </div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Upload Badge</span>
                  <span className="text-[8px] text-white/20 mt-1 uppercase">Under 5MB</span>
                </>
              )}
            </div>

            {/* Basic fields */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Squad Name</label>
                <input 
                  type="text"
                  placeholder="EX: HALDWANI WARRIORS"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder-white/20 focus:outline-none focus:border-[#CCFF00]/50 uppercase transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Sport Category</label>
                  <select 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold focus:outline-none focus:border-[#CCFF00]/50 outline-none"
                    value={formData.sportType}
                    onChange={(e) => setFormData({ ...formData, sportType: e.target.value })}
                  >
                    {SPORT_TYPES.map(sport => (
                      <option key={sport} value={sport} className="bg-[#131313]">{sport}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Home Town / City</label>
                  <select 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold focus:outline-none focus:border-[#CCFF00]/50 outline-none"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    {CITIES.map(city => (
                      <option key={city} value={city} className="bg-[#131313]">{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Captain Info (Optional but recommended) */}
          <div className="border-t border-white/5 pt-6 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-3 bg-[#CCFF00] rounded-full" />
              Captain Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Captain Name</label>
                <input 
                  type="text"
                  placeholder="Captain Full Name"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder-white/20 focus:outline-none focus:border-[#CCFF00]/50 transition-all"
                  value={formData.captainName}
                  onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Captain Phone (Optional)</label>
                <input 
                  type="tel"
                  placeholder="10-digit number"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder-white/20 focus:outline-none focus:border-[#CCFF00]/50 transition-all"
                  value={formData.captainContact}
                  onChange={(e) => setFormData({ ...formData, captainContact: e.target.value })}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">About the Squad</label>
            <textarea 
              placeholder="Tell your opponents what they're up against..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-medium placeholder-white/20 focus:outline-none focus:border-[#CCFF00]/50 transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Notice/Alert */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3">
            <Info size={18} className="text-[#CCFF00] shrink-0 mt-0.5" />
            <p className="text-[10px] text-white/40 leading-relaxed font-medium uppercase tracking-wider">
              By creating this team, you will be designated as the <strong className="text-white">Squad Captain (Owner)</strong>. You can search & invite players, build a roster, and challenge other teams using the Unique Team ID.
            </p>
          </div>

          {/* Submit */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#CCFF00] hover:bg-[#b8e600] disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#CCFF00]/10 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
            Form My Squad
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateTeamModal;
