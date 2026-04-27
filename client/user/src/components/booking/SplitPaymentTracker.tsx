import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageCircle,
  Share2
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export type ParticipantStatus = 'INVITED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CASH_COLLECTION';

export interface Participant {
  id: string;
  email?: string;
  phone?: string;
  status: ParticipantStatus;
  shareAmount: number;
}

interface SplitPaymentTrackerProps {
  bookingId: string;
  sportName: string;
  venueName: string;
  totalAmount: number;
  amountPaid: number;
  currency: string;
  participants: Participant[];
}

export function SplitPaymentTracker({
  bookingId,
  sportName,
  venueName,
  totalAmount,
  amountPaid,
  currency,
  participants,
}: SplitPaymentTrackerProps) {
  
  if (!participants || participants.length === 0) {
    return null;
  }

  const progressPercentage = Math.min(Math.round((amountPaid / totalAmount) * 100), 100);
  const isFullyPaid = amountPaid >= totalAmount;
  const pendingCount = participants.filter(p => p.status === 'INVITED' || p.status === 'FAILED').length;

  const handleNudge = (phone?: string) => {
    if (!phone) return;
    
    // Remove '+' if present and ensure it's digits only for wa.me
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hey! I booked ${sportName} at ${venueName}. Please pay your share for the booking here: https://app.owlturf.com/split-pay/${bookingId}`);
    
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleShareSystem = async () => {
    const text = `Hey! I booked ${sportName} at ${venueName}. Please pay your share of the booking.`;
    const url = `https://app.owlturf.com/split-pay/${bookingId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Split Booking Pay', text, url });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
       navigator.clipboard.writeText(`${text} ${url}`);
       // Could add a toast here like "Copied to clipboard"
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
           <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                 <Users className="h-5 w-5 text-primary" />
                 Split Payment Progress
              </CardTitle>
              <CardDescription className="mt-1">
                 {isFullyPaid 
                   ? "All friends have paid their share!" 
                   : `Awaiting payments from ${pendingCount} friend${pendingCount > 1 ? 's' : ''}`
                 }
              </CardDescription>
           </div>
           {isFullyPaid ? (
               <Badge className="bg-green-500 hover:bg-green-600">Complete</Badge>
           ) : (
               <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending</Badge>
           )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
         {/* Progress Bar */}
         <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
               <span>Collected</span>
               <span>{currency} {amountPaid.toFixed(2)} / {totalAmount.toFixed(2)}</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-primary/20" />
         </div>

         <Separator className="bg-primary/10" />

         {/* Participants List */}
         <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Friends Status</h4>
            <div className="space-y-3">
               {participants.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background border shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                              ${p.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                p.status === 'INVITED' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                          `}>
                              {index + 1}
                          </div>
                          <div className="flex flex-col truncate">
                              <span className="text-sm font-medium truncate">{p.email || p.phone}</span>
                              <span className="text-xs text-muted-foreground">{currency} {p.shareAmount.toFixed(2)}</span>
                          </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                           {p.status === 'PAID' ? (
                               <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1 px-2 py-0.5">
                                    <CheckCircle2 className="h-3 w-3" /> Paid
                               </Badge>
                           ) : p.status === 'FAILED' ? (
                               <Badge variant="outline" className="text-destructive border-red-200 bg-red-50 gap-1 px-2 py-0.5">
                                    <AlertCircle className="h-3 w-3" /> Failed
                               </Badge>
                           ) : (
                               <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1 px-2 py-0.5">
                                      <Clock className="h-3 w-3" /> Pending
                                  </Badge>
                                  {p.phone ? (
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleNudge(p.phone)}>
                                         <MessageCircle className="h-4 w-4" />
                                      </Button>
                                  ) : null}
                               </div>
                           )}
                      </div>
                  </div>
               ))}
            </div>
         </div>

         {/* General Share Button */}
         {!isFullyPaid && (
            <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/10" onClick={handleShareSystem}>
               <Share2 className="h-4 w-4" />
               Share Payment Link
            </Button>
         )}
      </CardContent>
    </Card>
  );
}
