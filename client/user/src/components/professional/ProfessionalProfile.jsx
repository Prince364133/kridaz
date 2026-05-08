import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { User, Mail, Phone, MapPin, Award, BookOpen, Camera, Save, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfessionalProfile() {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    hourlyPrice: 0,
    gameTypes: [],
    city: "",
    state: "",
    specialization: "",
    experience: "",
    certifications: []
  });

  const [newGameType, setNewGameType] = useState("");
  const [newCert, setNewCert] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const res = await axiosInstance.get(`/api/professional/details/${user.id || user.user}`);
      const prof = res.data.professional;
      setFormData({
        name: prof.name || "",
        hourlyPrice: prof.price || 0,
        gameTypes: prof.gameTypes || [],
        city: prof.city || "",
        state: prof.state || "",
        specialization: prof.businessDetails?.specialization || "",
        experience: prof.businessDetails?.experience || "",
        certifications: prof.certifications || []
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axiosInstance.put("/api/professional/update-profile", formData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addGameType = () => {
    if (newGameType && !formData.gameTypes.includes(newGameType)) {
      setFormData({ ...formData, gameTypes: [...formData.gameTypes, newGameType] });
      setNewGameType("");
    }
  };

  const removeGameType = (type) => {
    setFormData({ ...formData, gameTypes: formData.gameTypes.filter(t => t !== type) });
  };

  const addCert = () => {
    if (newCert && !formData.certifications.includes(newCert)) {
      setFormData({ ...formData, certifications: [...formData.certifications, newCert] });
      setNewCert("");
    }
  };

  const removeCert = (cert) => {
    setFormData({ ...formData, certifications: formData.certifications.filter(c => c !== cert) });
  };

  if (fetching) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-5xl font-black uppercase tracking-tight text-white">
            Public <span className="text-primary">Profile</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">How clients see you on the platform</p>
        </div>
        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="px-8 py-3 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hourly Rate (₹)</label>
                <input 
                  type="number" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                  value={formData.hourlyPrice}
                  onChange={(e) => setFormData({...formData, hourlyPrice: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">City</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">State</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Specialization</label>
              <input 
                type="text" 
                placeholder="e.g. Batting Coach, Fast Bowling Specialist"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Experience Bio</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none h-32 resize-none"
                placeholder="Tell users about your coaching/umpiring career..."
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Expertise & Certs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sports Expertise */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Sports Expertise</h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Add Sport"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-primary"
                value={newGameType}
                onChange={(e) => setNewGameType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGameType()}
              />
              <button onClick={addGameType} className="p-2 bg-primary text-black rounded-lg"><Plus size={16} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.gameTypes.map(type => (
                <span key={type} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white flex items-center gap-2">
                  {type}
                  <button onClick={() => removeGameType(type)} className="text-gray-500 hover:text-red-500"><Trash2 size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Certifications & Awards</h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Certification Name or URL"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-primary"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCert()}
              />
              <button onClick={addCert} className="p-2 bg-primary text-black rounded-lg"><Plus size={16} /></button>
            </div>
            <div className="space-y-3">
              {formData.certifications.map(cert => (
                <div key={cert} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Award size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-white uppercase">{cert}</span>
                  </div>
                  <button onClick={() => removeCert(cert)} className="text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
