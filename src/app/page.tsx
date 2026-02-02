'use client';
import ShoutoutDisplay from '@/components/shoutout-display';
import { useShoutouts } from '@/hooks/use-shoutouts';

export default function Home() {
  const { shoutouts, initialized } = useShoutouts();

  return (
    <main>
      <ShoutoutDisplay shoutouts={shoutouts} initialized={initialized} />
    </main>
  );
}
