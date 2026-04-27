export interface Venue {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  rating: number;
  numberOfReviews: number;
  followersCount?: number;
  isFollowing?: boolean;
}
