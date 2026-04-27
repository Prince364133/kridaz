import api from '../api';

export const socialGraphApi = {
  /**
   * Follow a venue
   */
  followVenue: async (venueId: string) => {
    const response = await api.post(`/social-graph/venues/${venueId}/follow`);
    return response.data;
  },

  /**
   * Unfollow a venue
   */
  unfollowVenue: async (venueId: string) => {
    const response = await api.delete(`/social-graph/venues/${venueId}/follow`);
    return response.data;
  },

  /**
   * Get venue followers count (if not already in venue detail)
   */
  getVenueFollowers: async (venueId: string) => {
    const response = await api.get(`/social-graph/venues/${venueId}/followers`);
    return response.data;
  },
};
