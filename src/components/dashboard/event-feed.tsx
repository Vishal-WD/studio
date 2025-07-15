import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

const events = [
  {
    title: "Annual Tech Symposium",
    description: "Join us for a day of tech talks, workshops, and networking with industry leaders.",
    date: "2024-10-26",
    location: "Main Auditorium",
    image: "https://placehold.co/600x400.png",
    aiHint: "technology conference",
  },
  {
    title: "Inter-Departmental Sports Meet",
    description: "Cheer for your department in a thrilling showcase of athletic talent.",
    date: "2024-11-05",
    location: "University Sports Complex",
    image: "https://placehold.co/600x400.png",
    aiHint: "sports competition",
  },
  {
    title: "Music & Arts Festival",
    description: "A vibrant celebration of creativity, featuring live music, art installations, and food stalls.",
    date: "2024-11-15",
    location: "Central Courtyard",
    image: "https://placehold.co/600x400.png",
    aiHint: "music festival",
  },
];

export function EventFeed() {
  return (
    <div>
      <h2 className="font-headline text-2xl font-semibold mb-4">Upcoming Events</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.title} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="p-0">
              <Image
                src={event.image}
                alt={event.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
                data-ai-hint={event.aiHint}
              />
            </CardHeader>
            <CardContent className="p-4 flex-1">
              <CardTitle className="font-headline text-lg mb-2">{event.title}</CardTitle>
              <CardDescription>{event.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 bg-muted/50 flex flex-col items-start gap-2">
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(event.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
               <Button variant="link" className="p-0 h-auto mt-2 text-primary">
                View Details <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
