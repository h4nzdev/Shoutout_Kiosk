import Image from 'next/image';
import { Shoutout, ShoutoutFrame } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

type ShoutoutCardProps = {
  shoutout: Shoutout;
  frame: ShoutoutFrame | undefined;
};

export default function ShoutoutCard({ shoutout, frame }: ShoutoutCardProps) {
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
  };

  return (
    <Card className={cn('overflow-hidden animate-enter', frame?.className)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {shoutout.image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md">
              <Image
                src={shoutout.image}
                alt="Shoutout image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          <p className="text-foreground/90 leading-relaxed font-body">{shoutout.message}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-t-white/10">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(shoutout.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
