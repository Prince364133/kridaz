import { useState, useEffect } from 'react';
import useAxiosPrivate from '@hooks/useAxiosPrivate';
import { toast } from 'react-hot-toast';

const useGameDisputes = () => {
  const [disputedGames, setDisputedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const axiosPrivate = useAxiosPrivate();

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const { data } = await axiosPrivate.get('/hosted-game/admin/disputes');
      setDisputedGames(data.games || []);
    } catch (error) {
      toast.error('Failed to load game disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const resolveDispute = async (gameId, action, refunds) => {
    try {
      setProcessingId(gameId);
      await axiosPrivate.post('/hosted-game/admin/resolve-dispute', {
        gameId,
        action,
        refunds
      });
      toast.success('Dispute resolved successfully');
      setDisputedGames(prev => prev.filter(g => g.id !== gameId));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to resolve dispute');
      throw error;
    } finally {
      setProcessingId(null);
    }
  };

  return {
    disputedGames,
    loading,
    processingId,
    resolveDispute,
    refresh: fetchDisputes
  };
};

export default useGameDisputes;
