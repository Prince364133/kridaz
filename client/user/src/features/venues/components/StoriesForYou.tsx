
"use client";

import { useState, useEffect } from "react"; // Import useState, useEffect
const Image = (props: any) => <img {...props} />;
import { Link } from "react-router-dom"; // Import Link
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { AlertCircle, Loader2, BookOpen } from "lucide-react"; // Import icons

interface Story {
  id: number;
  title: string;
  imageUrl: string;
  link: string; // Assuming a link to the full story
}

// Mock data
const mockStories: Story[] = [
  { id: 1, title: "Local Tournament Highlights", imageUrl: "/images/Venues/story1.png", link: "/blog/tournament-highlights" },
  { id: 2, title: "Meet the Community Stars", imageUrl: "/images/Venues/story2.jpg", link: "/blog/community-stars" },
  { id: 3, title: "New Venues in Your City", imageUrl: "/images/Venues/story3.png", link: "/blog/new-venues" },
  { id: 4, title: "Training Tips from Pros", imageUrl: "/images/Venues/story4.png", link: "/blog/training-tips" },
];

// Mocking a data hook
const useStories = () => {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setIsLoading(false);
      setStories(mockStories);
      // Simulate an error occasionally
      // if (Math.random() > 0.8) setError("Failed to load stories. Please try again.");
      // Simulate empty state
      // setStories([]);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return { stories, isLoading, error };
};


export default function StoriesForYou() {
  const { stories, isLoading, error } = useStories();

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[300px] bg-background text-foreground p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-lg text-muted-foreground">Loading stories...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[300px] bg-background text-foreground p-8">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Stories</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </section>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center min-h-[300px] bg-background text-foreground p-8">
        <Alert variant="default" className="w-full max-w-md">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <AlertTitle>No Stories Available</AlertTitle>
          <AlertDescription>
            Check back later for exciting stories and updates!
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="m-auto px-4 py-8 bg-background text-foreground"> {/* Adjusted padding and removed fixed px-16 */}
      <h2 className="text-3xl font-bold mb-6">
        <span className="text-foreground">Stories</span> <span className="text-primary">for You</span>
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-12">

        {stories.map((story) => (
          <Link to={story.link} key={story.id} className="relative w-full h-[250px] rounded-lg overflow-hidden shadow-lg mx-auto group"> {/* Wrapped card in Link */}
            <Image
              src={story.imageUrl}
              alt={story.title}
              fill // Use fill instead of layout="fill" for Next.js 13+
              style={{ objectFit: 'cover' }} // Use style prop for objectFit
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent p-4 flex items-end"> {/* Use bg-background/70 */}
              <h3 className="text-foreground text-lg font-semibold">{story.title}</h3> {/* Use text-foreground */}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
