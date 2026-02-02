import { Shoutout } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

type ShoutoutNextCardProps = {
  shoutout: Shoutout;
};

export default function ShoutoutNextCard({ shoutout }: ShoutoutNextCardProps) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardContent className="p-4">
        <p className="font-code text-sm text-white/40 truncate">
          &quot;{shoutout.message}&quot;
        </p>
        <p className="text-xs text-white/20 mt-2 truncate">From: {shoutout.sender}</p>
      </CardContent>
    </Card>
  );
}
