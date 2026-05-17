import React, { useState, useRef } from 'react';
import { useCreateTeamMutation } from '../../../redux/api/teamApi';
import { useUploadFileMutation } from '../../../redux/api/uploadApi';
import { X, Camera, Loader2, Users, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: 'CRICKET',
    captainName: '',
    captainPhone: '',
    image: '',
    city: ''
  });

  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      const response = await uploadFile(file).unwrap();
      if (response.success) {
        setFormData(prev => ({ ...prev, image: response.url }));
        toast.success('Logo uploaded successfully');
      }
    } catch (err) {
      toast.error('Failed to upload logo');
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Team name is required');
    
    try {
      const response = await createTeam({
        ...formData,
        type: 'MY_TEAM'
      }).unwrap();
      toast.success('Team created successfully!');
      if (onSuccess) onSuccess(response.team);
      onClose();
      setFormData({
        name: '',
        description: '',
        sport: 'CRICKET',
        captainName: '',
        captainPhone: '',
        image: '',
        city: ''
      });
      setPreview(null);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to create team');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-primary" /> Create New Team
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Logo Upload */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : isUploading ? (
                  <Loader2 className="text-primary animate-spin" size={32} />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="text-white/20 group-hover:text-primary transition-colors text-2xl" />
                    <span className="text-[10px] text-white/30">Upload Logo</span>
                  </div>
                )}
                
                {preview && !isUploading && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="text-white" size={24} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Team Name *</label>
            <input 
              type="text" 
              name="name"
              placeholder="e.g. Royal Strikers"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Sport</label>
              <select 
                name="sport"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                value={formData.sport}
                onChange={handleChange}
              >
                <option value="CRICKET">Cricket</option>
                <option value="FOOTBALL">Football</option>
                <option value="BADMINTON">Badminton</option>
                <option value="VOLLEYBALL">Volleyball</option>
                <option value="BASKETBALL">Basketball</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">City</label>
              <input 
                type="text" 
                name="city"
                placeholder="e.g. Mumbai"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Description</label>
            <textarea 
              name="description"
              placeholder="Tell something about your team..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Captain Name</label>
              <input 
                type="text" 
                name="captainName"
                placeholder="Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.captainName}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Captain Phone (Optional)</label>
              <input 
                type="text" 
                name="captainPhone"
                placeholder="Phone number"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.captainPhone}
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isCreating || isUploading}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : 'Create Team'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateTeamModal;
