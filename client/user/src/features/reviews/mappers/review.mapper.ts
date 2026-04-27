import { formatDistanceToNow, parseISO } from 'date-fns';
import type { ReviewDTO } from '@/contracts/reviews.contract';
import type { ReviewViewModel } from '../types';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0 || !parts[0]) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateRelative(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch (e) {
    return 'recently';
  }
}

export function toReviewViewModel(dto: ReviewDTO): ReviewViewModel {
  return {
    id: dto.id,
    author: {
      id: dto.author.id,
      name: dto.author.name || 'Anonymous Player',
      initials: getInitials(dto.author.name || 'Anonymous'),
    },
    rating: dto.rating,
    comment: dto.comment,
    images: dto.images,
    status: dto.status,
    isEdited: dto.isEdited,
    createdAtFormatted: formatDateRelative(dto.createdAt),
    timestamp: new Date(dto.createdAt),
    hasOwnerReply: !!dto.response,
    ownerReplyText: dto.response?.reply,
    ownerRepliedAtFormatted: dto.response ? formatDateRelative(dto.response.repliedAt) : undefined,
  };
}
