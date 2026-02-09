"use client";
import Header from "@/components/header";
import { useShoutouts } from "@/hooks/use-shoutouts";
import ShoutoutCard from "@/components/shoutout-card";
import { frames } from "@/lib/frames";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VaultAccessPage() {
  const { shoutouts, deleteShoutout, initialized } = useShoutouts();
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  const sortedShoutouts = [...shoutouts].sort((a, b) => {
    if (sortOrder === "latest") {
      return b.createdAt - a.createdAt;
    } else {
      return a.createdAt - b.createdAt;
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-3xl font-headline font-semibold mb-2">
            Vault Access
          </h1>
          <p className="text-muted-foreground mb-6">
            Manage all shoutouts - delete unwanted messages
          </p>

          <div className="flex gap-3 mb-8">
            <Button
              onClick={() => setSortOrder("latest")}
              variant={sortOrder === "latest" ? "default" : "outline"}
              className="font-mono"
            >
              Latest
            </Button>
            <Button
              onClick={() => setSortOrder("oldest")}
              variant={sortOrder === "oldest" ? "default" : "outline"}
              className="font-mono"
            >
              Oldest
            </Button>
          </div>

          {!initialized ? (
            <div className="grid grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : sortedShoutouts.length > 0 ? (
            <div className="grid grid-cols-2 gap-6">
              {sortedShoutouts.map((shoutout) => {
                const frame = frames.find((f) => f.id === shoutout.frame);
                return (
                  <ShoutoutCard
                    key={shoutout.id}
                    shoutout={shoutout}
                    frame={frame}
                    onDelete={deleteShoutout}
                    showActions={true}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No shoutouts yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
