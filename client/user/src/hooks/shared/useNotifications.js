import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@hooks/useAxiosInstance';
import { useSelector } from 'react-redux';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useSelector((state) => state.auth);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Determine base URL based on role
      let baseUrl = '/api/user/notifications';
      if (user.role === 'admin' || user.role === 'BMSP_ADMIN') {
        baseUrl = '/api/admin/notifications';
      } else if (user.role === 'owner' || user.role === 'VERIFIED_VENUE_OWNER' || user.role === 'BMSP_OWNER' || user.role === 'coach' || user.role === 'umpire') {
        baseUrl = '/api/owner/notifications';
      }

      const response = await axiosInstance.get(baseUrl);
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      let baseUrl = '/api/user/notifications';
      if (user.role === 'admin' || user.role === 'BMSP_ADMIN') baseUrl = '/api/admin/notifications';
      else if (user.role !== 'user') baseUrl = '/api/owner/notifications';

      await axiosInstance.put(`${baseUrl}/${id}/mark-read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      let baseUrl = '/api/user/notifications';
      if (user.role === 'admin' || user.role === 'BMSP_ADMIN') baseUrl = '/api/admin/notifications';
      else if (user.role !== 'user') baseUrl = '/api/owner/notifications';

      await axiosInstance.put(`${baseUrl}/mark-all-read`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const clearAll = async () => {
    try {
      let baseUrl = '/api/user/notifications';
      if (user.role === 'admin' || user.role === 'BMSP_ADMIN') baseUrl = '/api/admin/notifications';
      else if (user.role !== 'user') baseUrl = '/api/owner/notifications';

      await axiosInstance.delete(`${baseUrl}/clear`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
    refresh: fetchNotifications
  };
};

export default useNotifications;
