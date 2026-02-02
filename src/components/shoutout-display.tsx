import { Shoutout } from '@/lib/types';
import { frames } from '@/lib/frames';
import ShoutoutCard from './shoutout-card';
import { Skeleton } from './ui/skeleton';
import { HeartCrack } from 'lucide-react';

type ShoutoutDisplayProps = {
  shoutouts: Shoutout[];
  initialized: boolean;
};

export default function ShoutoutDisplay({ shoutouts, initialized }: ShoutoutDisplayProps) {
  const sortedShoutouts = shoutouts.slice().sort((a, b) => b.createdAt - a.createdAt);

  if (!initialized) {
    return (
      <div className="space-y-4">
         <h2 className="text-2xl font-headline font-semibold mb-4">Live Feed</h2>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-headline font-semibold mb-4">Live Feed</h2>
      {sortedShoutouts.length > 0 ? (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          {sortedShoutouts.map((shoutout) => {
            const frame = frames.find((f) => f.id === shoutout.frame);
            return <ShoutoutCard key={shoutout.id} shoutout={shoutout} frame={frame} />;
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
          <HeartCrack className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Shoutouts Yet</h3>
          <p className="text-muted-foreground mt-2">Be the first one to send a lovely message!</p>
        </div>
      )}
    </div>
  );
}
