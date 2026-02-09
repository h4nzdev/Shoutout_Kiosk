"use client";
import Header from "@/components/header";
import ShoutoutForm from "@/components/shoutout-form";
import { useShoutouts } from "@/hooks/use-shoutouts";

export default function CreatePage() {
  const { addShoutout } = useShoutouts();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="w-full max-w-lg mx-auto">
          <ShoutoutForm onAddShoutout={addShoutout} />
        </div>
      </main>
      <footer className="text-center py-4 text-muted-foreground text-sm">
        <p>Made with ❤️ by and for the CCS Community.</p>
      </footer>
    </div>
  );
}
