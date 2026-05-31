import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@hooks/useAxiosInstance';
import { useSelector } from 'react-redux';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, role } = useSelector((state) => state.auth);

  const getBaseUrl = useCallback(() => {
    const normalizedRole = (role || user?.role || "").toString().toLowerCase();

    if (normalizedRole === 'admin' || normalizedRole === 'bmsp_admin') {
      return '/api/admin/notifications';
    }

    if (
      normalizedRole.includes('venu_owners') ||
      normalizedRole === 'owner' ||
      normalizedRole === 'venue_owner' ||
      normalizedRole === 'verified_venue_owner' ||
      normalizedRole === 'bmsp_owner' ||
      ['coach', 'umpire', 'scorer', 'streamer'].some((r) => normalizedRole.includes(r))
    ) {
      return '/api/owner/notifications';
    }

    return '/api/user/notifications';
  }, [role, user?.role]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(getBaseUrl());
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [getBaseUrl, user?.id]);

  const markRead = async (id) => {
    try {
      await axiosInstance.put(`${getBaseUrl()}/${id}/mark-read`);
      setNotifications(prev => prev.map(n => (n.id || n._id) === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.put(`${getBaseUrl()}/mark-all-read`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const clearAll = async () => {
    try {
      await axiosInstance.delete(`${getBaseUrl()}/clear`);
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
