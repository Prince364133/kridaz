import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Loader2, UserCircle2, Activity,
  Dumbbell, Waves, Target, Zap, Wind, Circle, Crosshair,
  Flame, Timer, Shield, Trophy, Mountain, Star, Move
} from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";

import { useFirebaseCompleteProfileMutation, useGetSportsListQuery } from "@/lib/redux/features/auth/authApi";
import { setCredentials } from "@/lib/redux/features/auth/authSlice";
import { User as AuthUser } from "@/lib/types/auth.types";
import { tokenStorage } from "@/lib/utils/tokenStorage";
import { AuthCard } from "@/components/auth/AuthCard";
import { GradientButton } from "@/components/auth/GradientButton";
import { cn } from "@workspace/ui/lib/utils";

const CompleteProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], { required_error: "Please select a gender" }),
  sportIds: z.array(z.string()).min(1, "Please select at least one sport"),
});

type CompleteProfileFormValues = z.infer<typeof CompleteProfileSchema>;

const formItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// Gender Card Options for better UX
const genderOptions = [
  { value: "MALE", label: "Male", imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&q=80" },
  { value: "FEMALE", label: "Female", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&q=80" },
  { value: "OTHER", label: "Other", imageUrl: "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=200&h=200&fit=crop&q=80" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say", imageUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop&q=80" },
] as const;

// Sport → Lucide icon mapping
const sportIcons: Record<string, React.ElementType> = {
  "Cricket": Target,
  "Football": Circle,
  "Box Cricket": Target,
  "Badminton": Wind,
  "Tennis": Zap,
  "Padel Tennis": Zap,
  "Table Tennis": Zap,
  "Basketball": Trophy,
  "Field Hockey": Shield,
  "Swimming": Waves,
  "Kabaddi": Move,
  "Golf": Crosshair,
  "Wrestling": Dumbbell,
  "Futsal": Flame,
  "Boxing": Dumbbell,
  "Kho-Kho": Timer,
  "Bouldering": Mountain,
  "Pickleball": Star,
};

interface CompleteProfileStepProps {
  sessionToken: string;
  onSuccess: () => void;
}

export function CompleteProfileStep({ sessionToken, onSuccess }: CompleteProfileStepProps) {
  const dispatch = useDispatch();
  const { data: sports, isLoading: isLoadingSports, error: sportsError } = useGetSportsListQuery();
  const [completeProfile, { isLoading: isCompleting }] = useFirebaseCompleteProfileMutation();

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(CompleteProfileSchema),
    defaultValues: {
      name: "",
      sportIds: [],
    },
  });

  // Handle sports load error natively without crashing the form
  useEffect(() => {
    if (sportsError) {
      toast.error("Failed to load sports list. Please try refreshing the page.");
    }
  }, [sportsError]);

  const onSubmit = async (values: CompleteProfileFormValues) => {
    try {
      const apiResponse = await completeProfile({
        sessionToken,
        name: values.name,
        gender: values.gender,
        sportIds: values.sportIds,
      }).unwrap();

      if (apiResponse && "user" in apiResponse && "accessToken" in apiResponse) {
        dispatch(
          setCredentials({
            user: { ...apiResponse.user, role: apiResponse.user.role as AuthUser["role"] },
            token: apiResponse.accessToken,
          })
        );
        tokenStorage.setToken(apiResponse.accessToken);
        onSuccess();
      } else {
        form.setError("root.serverError", { message: "Registration successful, but unexpected API response." });
      }
    } catch (_error: unknown) {
      const errorData = _error as { data?: { message?: string }; message?: string };
      const message = errorData.data?.message || errorData.message || "Failed to complete profile. Please try again.";
      form.setError("root.serverError", { message });
    }
  };

  if (isLoadingSports) {
    return (
      <AuthCard>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#A1FF00]" />
          <p className="text-muted-foreground text-sm">Preparing your profile setup...</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#A1FF00]/10 flex items-center justify-center">
          <UserCircle2 className="w-8 h-8 text-[#A1FF00]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Complete Profile
        </h2>
        <p className="mt-2 text-muted-foreground">
          You&apos;re almost there! Tell us a bit about yourself.
        </p>
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Alert */}
          <AnimatePresence>
            {form.formState.errors.root?.serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 mb-4">
                  <AlertDescription>
                    {form.formState.errors.root.serverError.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {/* Name Input */}
            <motion.div custom={0} variants={formItemVariants} initial="hidden" animate="visible">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        disabled={isCompleting}
                        className="h-12 rounded border-border/50 bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Visual Gender Selection UX */}
            <motion.div custom={1} variants={formItemVariants} initial="hidden" animate="visible">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {genderOptions.map((option) => {
                          const isSelected = field.value === option.value;
                          return (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              key={option.value}
                              disabled={isCompleting}
                              onClick={() => field.onChange(option.value)}
                              className={cn(
                                "relative flex flex-col items-center justify-end overflow-hidden rounded-xl border-2 transition-all duration-200 h-28",
                                isSelected
                                  ? "border-[#A1FF00]"
                                  : "border-transparent bg-background/30 hover:border-white/20"
                              )}
                            >
                              <Image
                                src={option.imageUrl}
                                alt={option.label}
                                fill
                                sizes="25vw"
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                              />
                              {/* Dark gradient overlay for text legibility */}
                              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                              <span className="relative z-10 text-xs font-semibold text-white mb-2 pb-1 text-center w-full">
                                {option.label}
                              </span>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#A1FF00] flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-black" />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Visual Sports Selection UX */}
            <motion.div custom={2} variants={formItemVariants} initial="hidden" animate="visible">
              <FormField
                control={form.control}
                name="sportIds"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-3">
                      <FormLabel>Favorite Sports</FormLabel>
                      <p className="text-xs text-muted-foreground mt-1">Select the sports you are interested in playing.</p>
                    </div>
                    <FormControl>
                      {sports && sports.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {sports.map((sport) => {
                            const isSelected = field.value?.includes(sport.id);
                            const SportIcon = sportIcons[sport.name] ?? Activity;

                            return (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                key={sport.id}
                                disabled={isCompleting}
                                onClick={() => {
                                  const currentValue = field.value || [];
                                  const newValue = isSelected
                                    ? currentValue.filter((id) => id !== sport.id)
                                    : [...currentValue, sport.id];
                                  field.onChange(newValue);
                                }}
                                className={cn(
                                  "relative flex items-center gap-3 overflow-hidden rounded-xl border-2 p-3 text-left transition-all duration-200",
                                  isSelected
                                    ? "border-[#A1FF00] bg-[#A1FF00]/10"
                                    : "border-border/50 bg-background/30 hover:border-white/20 hover:bg-background/80"
                                )}
                              >
                                {/* Sport lucide icon */}
                                <span
                                  className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-all duration-200",
                                    isSelected
                                      ? "bg-[#A1FF00]/20 text-[#A1FF00] ring-2 ring-[#A1FF00] ring-offset-2 ring-offset-background"
                                      : "bg-muted/40 text-muted-foreground"
                                  )}
                                >
                                  <SportIcon className="w-5 h-5" />
                                </span>
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    isSelected ? "text-[#A1FF00]" : "text-foreground"
                                  )}
                                >
                                  {sport.name}
                                </span>
                                {isSelected && (
                                  <div className="ml-auto shrink-0 w-4 h-4 rounded-full bg-[#A1FF00] flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-black" />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-border p-8 text-center bg-background/30">
                          <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm font-medium text-foreground">No sports available</p>
                          <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.div custom={3} variants={formItemVariants} initial="hidden" animate="visible" className="pt-4 border-t border-border/50 mt-8">
            <GradientButton
              type="submit"
              isLoading={isCompleting}
              loadingText="Creating Profile..."
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Finish Setup
            </GradientButton>
          </motion.div>
        </form>
      </Form>
    </AuthCard>
  );
}
