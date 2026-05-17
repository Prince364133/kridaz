import React, { useState } from 'react';
import { useCreateGroupChatMutation } from '../../../redux/api/chatApi';
import { 
  Globe, 
  X, 
  ChevronRight, 
  Lock, 
  Camera,
  ChevronLeft
} from 'lucide-react';

const CreateCommunityModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Details
  const [communityName, setCommunityName] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');

  const [createGroupChat, { isLoading: isCreating }] = useCreateGroupChatMutation();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!communityName) return;

    try {
      // Create the Community Root
      const communityRoot = await createGroupChat({
        name: communityName,
        isCommunity: true,
        description: communityDescription,
        users: JSON.stringify([]) 
      }).unwrap();

      onSuccess(communityRoot);
      onClose();
    } catch (err) {
      console.error("Failed to create community:", err);
    }
  };

  const renderStep0 = () => (
    <div className="flex flex-col items-center text-center space-y-8 animate-fade-in p-8">
      <div className="relative">
        <div className="w-32 h-32 rounded-[40px] bg-[#84CC16]/10 flex items-center justify-center relative overflow-hidden group">
          <Globe size={48} className="text-[#84CC16]" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera size={24} className="text-white" />
          </div>
        </div>
      </div>
      
      <div className="space-y-3 max-w-sm">
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight leading-tight">Create a New Community</h2>
        <p className="text-white/40 text-sm font-medium leading-relaxed">
          Bring your related groups—like neighborhoods, schools, or work teams—together under one umbrella.
        </p>
      </div>

      <div className="w-full space-y-4 pt-4">
        <div className="flex items-center gap-4 text-left p-4 bg-white/[0.02] rounded-2xl border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-[#84CC16]/10 flex items-center justify-center shrink-0">
            <Globe size={20} className="text-[#84CC16]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Organize groups</p>
            <p className="text-white/30 text-xs mt-0.5">Add and manage groups after your community is created.</p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setStep(1)}
        className="w-full py-5 bg-[#84CC16] text-black font-black uppercase tracking-[0.2em] rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        Get Started <ChevronRight size={20} />
      </button>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8 animate-slide-in p-8">
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-[#84CC16] uppercase tracking-[0.3em] mb-3 ml-1">Community Details</label>
          <div className="space-y-4">
            <input
              type="text"
              autoFocus
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-[#84CC16] outline-none transition-all font-bold text-lg placeholder:text-white/10"
              placeholder="Community Name"
            />
            <textarea
              value={communityDescription}
              onChange={(e) => setCommunityDescription(e.target.value)}
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-[#84CC16] outline-none transition-all font-medium placeholder:text-white/10 resize-none text-base"
              placeholder="Community Description"
            />
          </div>
        </div>

        <div className="bg-[#84CC16]/5 border border-[#84CC16]/10 rounded-2xl p-5 flex items-start gap-4">
          <Lock size={20} className="text-[#84CC16] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#84CC16]/80 leading-relaxed font-semibold uppercase tracking-wide">
            Once created, you can start adding groups to organize your community members.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(0)}
          className="p-5 bg-white/5 text-white rounded-3xl hover:bg-white/10 transition-all flex items-center justify-center"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={isCreating || !communityName.trim()}
          className="flex-1 py-5 bg-[#84CC16] text-black font-black uppercase tracking-[0.2em] rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30"
        >
          {isCreating ? 'Creating...' : 'Create Community'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111111] border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        <div className="flex-1 overflow-hidden relative">
          {step > 0 && (
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-3 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white z-10"
            >
              <X size={20} />
            </button>
          )}

          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
        </div>
      </div>
    </div>
  );
};

export default CreateCommunityModal;
