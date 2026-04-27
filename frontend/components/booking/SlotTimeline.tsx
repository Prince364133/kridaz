'use client';

/**
 * Visual Slot Timeline Component
 * Color-coded timeline view for slot selection
 */

import { useMemo } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Clock, Lock, Check, Ban } from 'lucide-react';
import type { AvailableSlot } from '@/lib/discovery/types';

interface SlotTimelineProps {
  slots: AvailableSlot[];
  selectedSlots: AvailableSlot[];
  onSlotClick: (slot: AvailableSlot) => void;
  courtName?: string;
}

export function SlotTimeline({ slots, selectedSlots, onSlotClick, courtName }: SlotTimelineProps) {
  // Group slots by hour
  const slotsByHour = useMemo(() => {
    const map: Record<number, AvailableSlot[]> = {};
    slots.forEach(slot => {
      const hour = new Date(slot.startTime).getHours();
      if (!map[hour]) map[hour] = [];
      map[hour].push(slot);
    });
    return map;
  }, [slots]);

  const hours = Object.keys(slotsByHour).map(Number).sort((a, b) => a - b);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No slots available</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {courtName && (
        <div className="text-sm font-medium text-muted-foreground mb-3">
          {courtName}
        </div>
      )}
      
      {/* Timeline */}
      <div className="relative">
        {/* Time labels */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {hours.map(hour => {
            const hourSlots = slotsByHour[hour] || [];
            
            return (
              <div key={hour} className="flex flex-col items-center min-w-[60px]">
                <span className="text-xs text-muted-foreground mb-1">
                  {hour.toString().padStart(2, '0')}:00
                </span>
                <div className="flex gap-0.5">
                  {hourSlots.map(slot => {
                    const isSelected = selectedSlots.some(s => s.id === slot.id);
                    const isAvailable = slot.status === 'AVAILABLE';
                    const isBooked = slot.status === 'BOOKED';
                    const isReserved = slot.status === 'RESERVED';
                    const isBlocked = slot.status === 'BLOCKED';

                    return (
                      <button
                        key={slot.id}
                        onClick={() => isAvailable && onSlotClick(slot)}
                        disabled={!isAvailable}
                        className={cn(
                          "w-14 h-12 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-xs font-medium",
                          // Available - green
                          isAvailable && !isSelected && "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 cursor-pointer",
                          // Selected - primary
                          isSelected && "bg-primary border-primary text-primary-foreground scale-105 shadow-lg",
                          // Booked - gray
                          isBooked && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed",
                          // Reserved - yellow
                          isReserved && "bg-amber-50 border-amber-200 text-amber-600 cursor-not-allowed",
                          // Blocked - red
                          isBlocked && "bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-80"
                        )}
                        title={`${slot.status}`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4" />
                        ) : isBooked || isReserved ? (
                          <Lock className="w-3 h-3" />
                        ) : isBlocked ? (
                          <Ban className="w-3 h-3" />
                        ) : (
                          <span>₹{slot.price}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200" />
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span>Blocked</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Multi-Court Slot Timeline
 * Shows slots for multiple courts
 */
interface MultiCourtTimelineProps {
  slotsGroupedByCourt: Record<string, { courtName: string; slots: AvailableSlot[] }>;
  selectedSlots: AvailableSlot[];
  onSlotClick: (slot: AvailableSlot) => void;
}

export function MultiCourtTimeline({ slotsGroupedByCourt, selectedSlots, onSlotClick }: MultiCourtTimelineProps) {
  const courts = Object.entries(slotsGroupedByCourt);

  if (courts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">No courts available</p>
        <p className="text-sm">Select a date to see availability</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {courts.map(([courtId, court]) => (
        <div key={courtId} className="border rounded-lg p-4 bg-card">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {court.courtName}
          </h4>
          <SlotTimeline
            slots={court.slots}
            selectedSlots={selectedSlots.filter(s => s.courtId === courtId)}
            onSlotClick={onSlotClick}
          />
        </div>
      ))}
    </div>
  );
}

export default SlotTimeline;
