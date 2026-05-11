'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  History, Search, Trash2, ArrowRight, Database, Calendar,
  BarChart3, BrainCircuit, Loader2, RefreshCw, FileText, Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalysisListItem {
  id: number;
  name: string;
  file_name: string;
  row_count: number;
  column_count: number;
  column_names: string;
  created_at: string;
  updated_at: string;
  has_insights: number;
  has_recommendations: number;
}

interface PreviousAnalysesProps {
  onLoad: (analysisId: number) => void;
  isLoading: boolean;
}

export function PreviousAnalyses({ onLoad, isLoading }: PreviousAnalysesProps) {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchQuery.trim()
        ? `/api/analyses?q=${encodeURIComponent(searchQuery.trim())}`
        : '/api/analyses';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error('Failed to load analyses:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load previous analyses.' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { fetchAnalyses(); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this analysis? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Deleted', description: 'Analysis has been removed.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete analysis.' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'Z');
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const columns = analyses.length > 0 ? JSON.parse(analyses[0].column_names) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-lg tracking-tight">Previous Analyses</h2>
            <p className="text-xs text-muted-foreground">
              {analyses.length > 0 ? `${analyses.length} saved analysis${analyses.length !== 1 ? 'es' : ''}` : 'No saved analyses yet'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchAnalyses} disabled={loading} className="rounded-xl">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search analyses by name, file, or columns..."
          className="pl-9 rounded-xl"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : analyses.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-border/40 bg-card/10">
          <Database className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="text-sm font-headline font-bold text-foreground/60">No Saved Analyses</h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
            Upload a dataset and save your analysis to resume it later.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {analyses.map((analysis) => {
            let cols: string[] = [];
            try { cols = JSON.parse(analysis.column_names); } catch {}
            return (
              <Card
                key={analysis.id}
                className="group cursor-pointer border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 rounded-2xl overflow-hidden"
                onClick={() => onLoad(analysis.id)}
              >
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-headline font-bold tracking-tight truncate group-hover:text-primary transition-colors">
                        {analysis.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground truncate">{analysis.file_name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDelete(analysis.id, e)}
                      disabled={deletingId === analysis.id}
                      title="Delete"
                    >
                      {deletingId === analysis.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-semibold bg-muted/40">
                      <Layers className="w-2.5 h-2.5 mr-1" />
                      {analysis.row_count.toLocaleString()} rows
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-semibold bg-muted/40">
                      {analysis.column_count} cols
                    </Badge>
                    {analysis.has_recommendations ? (
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-semibold bg-primary/10 text-primary">
                        <BarChart3 className="w-2.5 h-2.5 mr-1" />
                        Charts
                      </Badge>
                    ) : null}
                    {analysis.has_insights ? (
                      <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-semibold bg-accent/10 text-accent">
                        <BrainCircuit className="w-2.5 h-2.5 mr-1" />
                        Insights
                      </Badge>
                    ) : null}
                  </div>

                  {/* Columns preview */}
                  {cols.length > 0 && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {cols.slice(0, 5).join(', ')}{cols.length > 5 ? ` +${cols.length - 5} more` : ''}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {formatDate(analysis.updated_at)}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Resume <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}