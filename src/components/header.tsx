import { Heart, Code } from 'lucide-react';

export default function Header() {
  return (
    <header className="py-6 border-b border-white/10">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <Heart className="text-primary w-8 h-8" />
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-center tracking-tighter">
          CCS Valentine <span className="text-primary">Shoutout</span>
        </h1>
        <Code className="text-accent w-8 h-8" />
      </div>
    </header>
  );
}
