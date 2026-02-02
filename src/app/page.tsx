'use client';
import Header from '@/components/header';
import ShoutoutDisplay from '@/components/shoutout-display';
import ShoutoutForm from '@/components/shoutout-form';
import { useShoutouts } from '@/hooks/use-shoutouts';

export default function Home() {
  const { addShoutout, shoutouts, initialized } = useShoutouts();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ShoutoutForm onAddShoutout={addShoutout} />
          </div>
          <div className="lg:col-span-2">
            <ShoutoutDisplay shoutouts={shoutouts} initialized={initialized} />
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-muted-foreground text-sm">
        <p>Made with ❤️ by and for the CCS Community.</p>
      </footer>
    </div>
  );
}
