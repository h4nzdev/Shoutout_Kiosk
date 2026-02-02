'use client';
// This page is no longer in use.
// The shoutout feed is now at the root page '/'.

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ShoutoutsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
        <h1 className="text-3xl font-headline font-bold mb-4">This page has moved!</h1>
        <p className="mb-8 text-muted-foreground max-w-sm">The shoutout feed has been moved to the home page, and the creation/management page is now at `/create`.</p>
        <div className="flex gap-4">
            <Button asChild>
                <Link href="/">
                    Go to Feed
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/create">
                    Go to Create
                </Link>
            </Button>
        </div>
    </div>
  )
}
