"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "@/hooks/useRouter";
import { format } from 'date-fns';
import { routes } from "@/infrastructure/config/routes";
import {
  Gamepad2,
  CalendarDays,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Our custom Popover component
import { Calendar } from "@/components/ui/calendar"; // Our custom Calendar component
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { GameFormData } from "../../app/host-a-game/page"; // Import GameFormData from host-a-game/page


// Props for HostAGameForm
interface HostAGameFormProps {
  setFormData: React.Dispatch<React.SetStateAction<GameFormData>>; // Callback to update parent's state
}


// Form Schema
const gameSchema = z.object({
  title: z.string().min(3, "Title is required.").max(100, "Title too long."),
  sport: z.string().min(1, "Sport is required."),
  description: z.string().max(500, "Description too long.").optional().or(z.literal('')),
  venue: z.string().min(3, "Venue is required."),
  date: z.date().min(new Date(), "Date must be in the future."), // Enforce future date
  time: z.string().min(1, "Time is required."),
  playersNeeded: z.coerce.number().min(1, "At least 1 player needed.").max(20, "Max 20 players."),
  skillLevel: z.enum(["Beginner", "Intermediate", "Advanced", "All"], { required_error: "Skill level is required." }),
  costPerPlayer: z.coerce.number().min(0, "Cost cannot be negative.").max(10000, "Cost too high."),
});

type GameFormValues = z.infer<typeof gameSchema>;


// Mocking API hook
const useCreateGame = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const createGame = async (data: GameFormValues) => {
    console.log('Creating game with data:', data);
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    return new Promise((resolve, _reject) => {
      setTimeout(() => {
        setIsLoading(false);
        // Simulate error sometimes
        // if (Math.random() > 0.7) {
        //   setError("Failed to create game. Please try again.");
        //   reject("Error");
        // } else {
          setIsSuccess(true);
          resolve("Game created successfully!");
        // }
      }, 1500);
    });
  };
  return { createGame, isLoading, error, isSuccess, setIsSuccess };
};


export function HostAGameForm({ setFormData }: HostAGameFormProps) {
  const { push: pushRoute } = useRouter();
  const { createGame, isLoading: isCreatingGame, error: createGameError, isSuccess: isCreateGameSuccess, setIsSuccess: setCreateGameSuccess } = useCreateGame();

  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      sport: "",
      venue: "",
      date: undefined,
      time: "",
      playersNeeded: 1,
      skillLevel: "All",
      title: "",
      description: "",
      costPerPlayer: 0,
    },
  });

  const { handleSubmit, formState: { errors: _errors }, watch, reset } = form; // Added _ prefix to errors
  // Removed unused control
  // Removed unused setValue
  // Removed unused reject from useCreateGame (if it was there)

  // Watch form fields to update parent for live preview
  const watchedFields = watch();
  const prevWatchedFields = React.useRef(JSON.stringify(watchedFields));

  useEffect(() => {
    const currentWatchedFields = JSON.stringify(watchedFields);
    if (prevWatchedFields.current !== currentWatchedFields) {
      setFormData(watchedFields);
      prevWatchedFields.current = currentWatchedFields;
    }
  }, [watchedFields, setFormData]);

  const onFormSubmit = async (data: GameFormValues) => {
    setCreateGameSuccess(false); // Reset success state
    try {
      await createGame(data);
      setCreateGameSuccess(true);
      reset(); // Clear form on success
      // Optional: Redirect to game details page or dashboard
      pushRoute(routes.games.hosted);
    } catch {
      // Error handled by createGameError state
    }
  };

  const handleCancel = () => {
    reset(); // Reset form using react-hook-form's reset method
    setCreateGameSuccess(false); // Reset success state
    pushRoute(routes.explore); // Redirect to explore or dashboard
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        <h2 className="text-3xl font-bold text-foreground text-center">
          Create Your Game
        </h2>
        <fieldset className="grid gap-6">
          <legend className="text-xl font-semibold text-primary mb-4 border-b border-border/20 pb-2 w-full">
            Game Details
          </legend>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="title">Game Title</Label>
                  <FormControl>
                    <Input placeholder="e.g., Morning Football Fun" {...field} disabled={isCreatingGame} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="sport">Sport</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCreatingGame}>
                    <FormControl>
                      <SelectTrigger id="sport">
                        <SelectValue placeholder="Select a sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Football">Football</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Cricket">Cricket</SelectItem>
                      <SelectItem value="Badminton">Badminton</SelectItem>
                      {/* Add more sports */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="description">Description</Label>
                <FormControl>
                  <Textarea placeholder="Provide any extra details about your game (e.g., what to bring, rules, etc.)" {...field} disabled={isCreatingGame} rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <fieldset className="grid gap-6">
          <legend className="text-xl font-semibold text-primary mb-4 border-b border-border/20 pb-2 w-full">
            Venue & Time
          </legend>
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="venue">Venue</Label>
                  <FormControl>
                    <Input placeholder="Search for a venue" {...field} disabled={isCreatingGame} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          disabled={isCreatingGame}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01") // Disable past dates
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="time">Time</Label>
                  <FormControl>
                    <Input type="time" placeholder="HH:MM" {...field} disabled={isCreatingGame} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-6">
          <legend className="text-xl font-semibold text-primary mb-4 border-b border-border/20 pb-2 w-full">
            Player Details
          </legend>
          <div className="grid md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="playersNeeded"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="playersNeeded">Players Needed</Label>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))} // Ensure number type
                      disabled={isCreatingGame}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skillLevel"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="skillLevel">Skill Level</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isCreatingGame}>
                    <FormControl>
                      <SelectTrigger id="skillLevel">
                        <SelectValue placeholder="Select a skill level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="All">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPerPlayer"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="costPerPlayer">Cost per Player (EUR)</Label>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="0"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))} // Ensure number type
                      disabled={isCreatingGame}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {/* Form Submission Feedback */}
        {createGameError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Game Creation Failed</AlertTitle>
            <AlertDescription>{createGameError}</AlertDescription>
          </Alert>
        )}
        {isCreateGameSuccess && (
          <Alert className="bg-green-500 text-white">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Game Created!</AlertTitle>
            <AlertDescription>Your game has been successfully created.</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            type="button"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={handleCancel}
            disabled={isCreatingGame}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isCreatingGame}
          >
            {isCreatingGame ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Game...
              </>
            ) : (
              <>
                <Gamepad2 className="mr-2 h-4 w-4" aria-hidden="true" /> Create Game
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
