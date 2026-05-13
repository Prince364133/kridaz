import React, { useState } from 'react';
import { useCreateTeamMutation } from '../../redux/api/teamApi';
import { FaTimes, FaCamera, FaSpinner, FaUsers } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const [createTeam, { isLoading }] = useCreateTeamMutation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport: 'CRICKET',
    captainName: '',
    captainPhone: '',
    image: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Team name is required');
    
    try {
      const response = await createTeam(formData).unwrap();
      toast.success('Team created successfully!');
      if (onSuccess) onSuccess(response.team);
      onClose();
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
            <FaUsers className="text-primary" /> Create New Team
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Upload Placeholder */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-colors">
                <FaCamera className="text-white/20 group-hover:text-primary transition-colors text-2xl" />
              </div>
              <p className="text-[10px] text-center text-white/30 mt-2">Upload Team Logo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : 'Create Team'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateTeamModal;
