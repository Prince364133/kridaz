'use client';

/**
 * Empty State Components
 * Beautiful empty states with illustrations
 */

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import {
  Calendar,
  Search,
  MapPin,
  Ticket,
  Clock,
  ShoppingBag,
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {/* Icon with gradient background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          {icon || <Ticket className="w-10 h-10 text-primary/60" />}
        </div>
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      
      {/* Action */}
      {action && (
        action.href ? (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}

/**
 * No Search Results
 */
export function NoSearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={<Search className="w-10 h-10 text-muted-foreground" />}
      title="No venues found"
      description={query 
        ? `We couldn't find any venues matching "${query}". Try adjusting your search.`
        : "Try searching for a venue name or city."
      }
    />
  );
}

/**
 * No Bookings
 */
export function NoBookings({ type = 'upcoming' }: { type?: 'upcoming' | 'past' | 'cancelled' | 'all' }) {
  const messages = {
    upcoming: {
      title: "No upcoming bookings",
      description: "You don't have any scheduled games. Find a venue and book your next match!",
    },
    past: {
      title: "No past bookings",
      description: "Your completed bookings will appear here.",
    },
    cancelled: {
      title: "No cancelled bookings",
      description: "You haven't cancelled any bookings. Great track record!",
    },
    all: {
      title: "No bookings yet",
      description: "Start your sports journey by booking your first game!",
    },
  };

  const msg = messages[type];

  return (
    <EmptyState
      icon={<Calendar className="w-10 h-10 text-muted-foreground" />}
      title={msg.title}
      description={msg.description}
      action={{
        label: "Find Venues",
        href: "/venues",
      }}
    />
  );
}

/**
 * No Slots Available
 */
export function NoSlotsAvailable({ date }: { date?: Date }) {
  return (
    <EmptyState
      icon={<Clock className="w-10 h-10 text-amber-500" />}
      title="No slots available"
      description={date 
        ? `All slots are booked for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. Try another date!`
        : "Select a date to see available time slots."
      }
    />
  );
}

/**
 * No Venues
 */
export function NoVenues() {
  return (
    <EmptyState
      icon={<MapPin className="w-10 h-10 text-muted-foreground" />}
      title="No venues nearby"
      description="We couldn't find any venues in your area. Try expanding your search."
    />
  );
}

/**
 * Cart Empty
 */
export function CartEmpty() {
  return (
    <EmptyState
      icon={<ShoppingBag className="w-10 h-10 text-muted-foreground" />}
      title="No slots selected"
      description="Select time slots from the grid to add them to your booking."
    />
  );
}

export default EmptyState;
