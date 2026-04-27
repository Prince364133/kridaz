import { QRCodeSVG } from 'qrcode.react';

interface BookingQRCodeProps {
  bookingId: string;
  bookingReference: string;
}

export const BookingQRCode = ({ bookingId, bookingReference }: BookingQRCodeProps) => {
  // In a real app, this would be a secure verification URL or signed payload
  // For MVP, we use the booking ID/Reference combo
  const qrValue = JSON.stringify({
    id: bookingId,
    ref: bookingReference,
    t: Date.now()
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm mx-auto max-w-[200px]">
      <QRCodeSVG 
        value={qrValue} 
        size={160} 
        level="H" 
        includeMargin={true}
      />
      <p className="mt-2 text-xs text-muted-foreground font-mono text-center">
        {bookingReference}
      </p>
    </div>
  );
};
