'use client';
import ShoutoutDisplay from '@/components/shoutout-display';
import { useShoutouts } from '@/hooks/use-shoutouts';

export default function Home() {
  const { shoutouts, initialized } = useShoutouts();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow flex items-center justify-center">
        <ShoutoutDisplay shoutouts={shoutouts} initialized={initialized} />
      </main>
    </div>
  );
}
