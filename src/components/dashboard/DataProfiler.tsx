'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Database, CheckCircle2, AlertTriangle, Info, BarChart3,
  Type, Hash, Calendar, ToggleLeft, Layers, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { profileData, DataProfile } from '@/app/lib/data-validation';

interface DataProfilerProps {
  data: Record<string, any>[];
  open: boolean;
  onClose: () => void;
}

export function DataProfiler({ data, open, onClose }: DataProfilerProps) {
  const profile = useMemo(() => {
    if (!data || data.length === 0) return null;
    return profileData(data);
  }, [data]);

  if (!open || !profile) return null;

  const typeIcon = (type: string) => {
    switch (type) {
      case 'numeric': return <Hash className="w-3 h-3 text-blue-500" />;
      case 'categorical': return <Type className="w-3 h-3 text-purple-500" />;
      case 'temporal': return <Calendar className="w-3 h-3 text-orange-500" />;
      case 'boolean': return <ToggleLeft className="w-3 h-3 text-green-500" />;
      case 'mixed': return <Layers className="w-3 h-3 text-yellow-500" />;
      default: return <Info className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <Card className="border border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-headline">Data Profile</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[9px] uppercase tracking-widest font-bold">
              Quality: {profile.dataQualityScore}/100
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close data profile"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          {profile.totalRows.toLocaleString()} rows · {profile.totalColumns} columns · {profile.memoryEstimate}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Quality Score */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Data Quality</span>
            <span className="font-bold">{profile.dataQualityScore}%</span>
          </div>
          <Progress value={profile.dataQualityScore} className="h-2" />
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="text-[9px] bg-green-500/10 text-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {profile.completeness}% complete
          </Badge>
          {profile.duplicates > 0 && (
            <Badge variant="secondary" className="text-[9px] bg-yellow-500/10 text-yellow-500">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {profile.duplicates} duplicates
            </Badge>
          )}
          {profile.columns.filter(c => c.isPrimaryKey).length > 0 && (
            <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-500">
              {profile.columns.filter(c => c.isPrimaryKey).length} ID column(s)
            </Badge>
          )}
        </div>

        <Separator className="bg-border/30 mb-4" />

        {/* Column Details */}
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-3">
            {profile.columns.map((col, idx) => (
              <div key={idx} className="p-2.5 bg-muted/15 rounded-lg border border-border/25 hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {typeIcon(col.type)}
                    <span className="text-xs font-bold truncate max-w-[120px]">{col.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-muted/50">
                      {col.type}
                    </Badge>
                    {col.isConstant && (
                      <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-yellow-500/10 text-yellow-500">
                        constant
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Null percentage bar */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${100 - col.nullPercentage}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground w-16 text-right">
                    {col.uniqueCount} unique
                  </span>
                </div>

                {/* Stats for numeric columns */}
                {col.stats && (
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    <div className="text-center p-1 bg-muted/20 rounded">
                      <div className="text-[8px] text-muted-foreground">Min</div>
                      <div className="text-[10px] font-bold">{col.stats.min?.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-1 bg-muted/20 rounded">
                      <div className="text-[8px] text-muted-foreground">Mean</div>
                      <div className="text-[10px] font-bold">{col.stats.mean?.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-1 bg-muted/20 rounded">
                      <div className="text-[8px] text-muted-foreground">Max</div>
                      <div className="text-[10px] font-bold">{col.stats.max?.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Top values for categorical */}
                {col.topValues && col.topValues.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {col.topValues.slice(0, 3).map((tv, i) => (
                      <div key={i} className="flex items-center gap-2 text-[9px]">
                        <span className="text-muted-foreground truncate max-w-[80px]">{tv.value}</span>
                        <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                          <div className="h-full bg-accent/60 rounded-full" style={{ width: `${tv.percentage}%` }} />
                        </div>
                        <span className="text-muted-foreground w-8 text-right">{tv.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}