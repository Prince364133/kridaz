export interface ReviewAuthorViewModel {
  id: string;
  name: string;
  initials: string;
}

export interface ReviewViewModel {
  id: string;
  author: ReviewAuthorViewModel;
  rating: number;
  comment: string | null;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isEdited: boolean;
  createdAtFormatted: string;
  timestamp: Date; // For sorting
  hasOwnerReply: boolean;
  ownerReplyText?: string;
  ownerRepliedAtFormatted?: string;
}
