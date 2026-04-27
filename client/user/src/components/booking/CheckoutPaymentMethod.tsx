import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Users } from 'lucide-react';
import { useFeatureFlags } from '@/infrastructure/config/FeatureFlagProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const participantSchema = z.object({
  email: z.string().email('Invalid email address').or(z.literal('')),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').or(z.literal('')),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone must be provided",
  path: ["email"] // Highlight email field on common error
});

export const splitPaymentSchema = z.object({
  paymentType: z.enum(['FULL', 'SPLIT']),
  participants: z.array(participantSchema)
    .max(9, "You can invite a maximum of 9 friends (10 players total)"),
  consentDataPrivacy: z.boolean().refine(val => val === true, {
    message: "You must consent to sharing contact details"
  })
});

export type SplitPaymentFormData = z.infer<typeof splitPaymentSchema>;

interface CheckoutPaymentMethodProps {
  totalAmount: number;
  currency: string;
  onMethodChange: (data: SplitPaymentFormData, isValid: boolean) => void;
}

export function CheckoutPaymentMethod({ totalAmount, currency, onMethodChange }: CheckoutPaymentMethodProps) {
  const { flags } = useFeatureFlags();

  const { register, control, watch, formState: { errors, isValid } } = useForm<SplitPaymentFormData>({
    resolver: zodResolver(splitPaymentSchema),
    defaultValues: {
      paymentType: 'FULL',
      participants: [],
      consentDataPrivacy: false
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants"
  });

  const paymentType = watch('paymentType');
  const participants = watch('participants');
  
  // Calculate shares dynamically
  const totalPlayers = paymentType === 'SPLIT' ? participants.length + 1 : 1;
  const organizerShare = totalPlayers > 1 ? (totalAmount / totalPlayers) : totalAmount;
  const friendShare = totalPlayers > 1 ? (totalAmount / totalPlayers) : 0;

  // Sync state up to parent page
  React.useEffect(() => {
    const data = watch();
    onMethodChange(data as SplitPaymentFormData, isValid);
  }, [watch, isValid, onMethodChange]);

  return (
    <div className="space-y-6">
      <RadioGroup defaultValue="FULL" {...register('paymentType')} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pay Full Amount */}
        <div className="relative flex flex-col items-start gap-4 rounded-lg border border-muted p-4 shadow-sm hover:bg-accent/50 cursor-pointer [&:has([data-state=checked])]:border-primary" onClick={() => control._defaultValues.paymentType = "FULL"}>
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                     <RadioGroupItem value="FULL" id="pay-full" />
                     <Label htmlFor="pay-full" className="font-semibold cursor-pointer">Pay Full Amount</Label>
                </div>
            </div>
            <div className="text-sm text-muted-foreground ml-6">
                 Pay the entire ₹{totalAmount.toFixed(2)} upfront to confirm your booking immediately.
            </div>
        </div>

        {/* Split with Friends */}
        {flags.enableSplitPayments && (
         <div className="relative flex flex-col items-start gap-4 rounded-lg border border-muted p-4 shadow-sm hover:bg-accent/50 cursor-pointer [&:has([data-state=checked])]:border-primary hover:border-primary/50" onClick={() => control._defaultValues.paymentType = "SPLIT"}>
            <div className="flex w-full items-center justify-between">
                 <div className="flex items-center gap-2">
                     <RadioGroupItem value="SPLIT" id="split-pay" />
                     <Label htmlFor="split-pay" className="font-semibold cursor-pointer flex items-center gap-2">
                        Split with Friends
                        <Badge variant="secondary" className="bg-primary/10 text-primary">Beta</Badge>
                     </Label>
                 </div>
                 <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground ml-6">
                  Only pay your exact share now. We&apos;ll invite your friends to pay the rest.
            </div>
        </div>
        )}
      </RadioGroup>

      {/* Dynamic Friends List */}
      {paymentType === 'SPLIT' && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
           <Separator className="my-6" />
           <div className="flex items-center justify-between mb-4">
               <div>
                   <h4 className="font-semibold text-foreground">Invite Participants</h4>
                   <p className="text-sm text-muted-foreground">Add their email or phone number</p>
               </div>
               <Button 
                 type="button" 
                 variant="outline" 
                 size="sm" 
                 onClick={() => append({ email: '', phone: '' })}
                 disabled={fields.length >= 9}
               >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Friend
               </Button>
           </div>
           
           <div className="space-y-4">
               {fields.map((field, index) => (
                   <div key={field.id} className="flex gap-2 items-start">
                       <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2">
                           <div>
                               <Input 
                                 placeholder="Friend's Email" 
                                 {...register(`participants.${index}.email`)} 
                               />
                               {errors.participants?.[index]?.email && (
                                   <p className="text-xs text-destructive mt-1">{errors.participants[index].email.message}</p>
                               )}
                           </div>
                           <div>
                                <Input 
                                 placeholder="Friend's Phone (Optional)" 
                                 {...register(`participants.${index}.phone`)} 
                               />
                           </div>
                       </div>
                       <Button 
                         type="button" 
                         variant="ghost" 
                         size="icon" 
                         className="text-muted-foreground hover:text-destructive shrink-0"
                         onClick={() => remove(index)}
                       >
                           <Trash2 className="h-4 w-4" />
                       </Button>
                   </div>
               ))}
               
               {fields.length === 0 && (
                   <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                       Click &quot;Add Friend&quot; to start splitting this booking.
                   </div>
               )}
           </div>

           {/* Live Calculation Preview */}
           {fields.length > 0 && (
                <div className="mt-6 bg-muted/50 rounded-lg p-4 space-y-2">
                     <h4 className="font-medium text-sm flex justify-between">
                         <span>Your Upfront Share ({1}/{totalPlayers}):</span>
                         <span className="text-primary font-bold">{currency} {organizerShare.toFixed(2)}</span>
                     </h4>
                     <p className="text-xs text-muted-foreground flex justify-between">
                         <span>Pending Friend Share ({fields.length}/{totalPlayers}):</span>
                         <span>{fields.length} x {currency} {friendShare.toFixed(2)}</span>
                     </p>
                </div>
           )}

           {/* Data Privacy Consent Checkbox */}
           {fields.length > 0 && (
             <div className="mt-6 flex items-start space-x-3 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                 <Checkbox id="consentDataPrivacy" {...register("consentDataPrivacy")} />
                 <div className="grid gap-1.5 leading-none">
                     <Label htmlFor="consentDataPrivacy" className="cursor-pointer text-sm font-medium text-blue-900 dark:text-blue-300">
                         Data Privacy Consent
                     </Label>
                     <p className="text-xs text-blue-700/80 dark:text-blue-400/80">
                         I confirm I have permission to share the contact details of these participants. PlaySpots will solely use this to send secure payment links and booking updates.
                     </p>
                 </div>
                 {errors.consentDataPrivacy && (
                     <p className="text-xs text-destructive mt-1 block w-full">{errors.consentDataPrivacy.message}</p>
                 )}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
