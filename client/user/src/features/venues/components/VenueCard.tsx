import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Gamepad2 } from "lucide-react"; // Import Star, MapPin, Gamepad2 from lucide-react
import { Link } from "react-router-dom";
const Image = (props: any) => <img {...props} />; // Import Image component

interface VenueCardProps {
  venue: {
    id: string;
    name: string;
    location: string;
    sports: string[];
    rating: number;
    numberOfReviews: number;
    imageUrl: string;
  };
}

export default function VenueCard({ venue }: VenueCardProps) {
  return (
    <Link to={`/venues/${venue.id}`}>
      <Card className="relative flex flex-col bg-card border-border text-foreground cursor-pointer 
                      w-full h-full rounded-lg shadow-md hover:shadow-turf-green/20 transition-shadow duration-300">

        {/* Image */}
        <CardHeader className="p-0">
          <Image
            src={venue.imageUrl}
            alt={venue.name}
            width={400} // Approximate width, adjust based on actual image usage
            height={160} // h-36/h-40
            className="w-full h-36 sm:h-40 object-cover rounded-t-lg"
          />
        </CardHeader>

        {/* Content */}
        <CardContent className="p-3 flex-grow text-sm">
          <CardTitle className="text-base font-bold mb-1 truncate">
            {venue.name}
          </CardTitle>

          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <MapPin className="w-3 h-3 mr-1" aria-hidden="true" /> {/* MapPin from lucide-react */}
            <span className="truncate">{venue.location}</span>
          </div>

          <div className="flex items-center gap-1 text-xs mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < venue.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                aria-hidden="true"
              />
            ))}
            <span className="ml-1 text-muted-foreground">
              ({venue.numberOfReviews} reviews)
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2 text-xs text-muted-foreground">
            {venue.sports.map((sport, index) => (
              <span key={index} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                <Gamepad2 className="h-3 w-3" aria-hidden="true" /> {sport}
              </span>
            ))}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-2 pt-0">
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm" aria-label={`Book ${venue.name} now`}>
            <Link to={`/venues/${venue.id}`}>
              Book Now
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
