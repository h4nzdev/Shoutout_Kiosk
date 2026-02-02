import Image from 'next/image';
import { Shoutout } from '@/lib/types';
import { Heart } from 'lucide-react';

type ShoutoutStreamCardProps = {
  shoutout: Shoutout;
};

export default function ShoutoutStreamCard({ shoutout }: ShoutoutStreamCardProps) {
  return (
    <div className="frame-stream text-foreground">
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr] gap-6 p-6 items-center">
        {shoutout.image ? (
          <div className="relative aspect-square w-full h-auto overflow-hidden rounded-md flex items-center justify-center">
            <Image
              src={shoutout.image}
              alt="Shoutout image"
              width={300}
              height={300}
              className="object-contain"
            />
          </div>
        ) : (
             <div className="relative aspect-square w-full h-auto overflow-hidden rounded-md flex items-center justify-center">
                 <Heart className="w-32 h-32 text-primary/30" />
             </div>
        )}

        <div className="flex flex-col justify-center space-y-4">
          <div>
            <p className="text-label">&lt;Sender&gt;</p>
            <h3 className="text-2xl lg:text-3xl font-bold mt-1">{shoutout.sender}</h3>
          </div>
          <div>
            <p className="text-label">&lt;Recipient&gt;</p>
            <p className="text-xl lg:text-2xl mt-1">To: {shoutout.recipient}</p>
          </div>
          
          <div className="border border-primary/50 rounded-md p-4 mt-4 relative bg-black/20">
             <p className="text-foreground/90 leading-relaxed font-body text-md lg:text-lg">
                &quot;{shoutout.message}&quot;
             </p>
          </div>
        </div>
      </div>
       <div className="px-6 pb-4 flex items-center gap-2 text-xs text-primary/80">
          <Heart className="w-3 h-3 fill-current" />
          <span>SYSTEM_READY 200 OK</span>
        </div>
    </div>
  );
}
