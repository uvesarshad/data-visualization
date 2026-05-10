'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function ChartSkeleton() {
  return (
    <Card className="h-full border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-32 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 w-48 bg-muted/20 rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted/20 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[220px] p-2">
        <div className="w-full h-full bg-muted/10 rounded-lg animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-muted/20 rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}