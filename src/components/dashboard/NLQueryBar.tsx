'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Loader2, X, ChevronRight, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NLQueryBarProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  result?: { title: string; explanation: string; chartType: string } | null;
  onClearResult?: () => void;
}

const SUGGESTIONS = [
  'Show revenue by category',
  'Compare profit margins across regions',
  'What is the distribution of prices?',
  'Trend of sales over time',
  'Top 10 products by revenue',
  'Correlation between marketing spend and revenue',
];

export function NLQueryBar({ onSubmit, isLoading, result, onClearResult }: NLQueryBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSubmit(suggestion);
  };

  return (
    <div className="space-y-2.5">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2.5 p-1.5 bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm hover:border-border/80 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <div className="flex items-center gap-2 flex-1 pl-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder='Ask anything about your data... e.g. "Show revenue by region"'
              className="w-full bg-transparent py-2 text-sm focus:outline-none placeholder:text-muted-foreground/40"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 pr-1">
            {!query && !isLoading && (
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/40 border border-border/30 rounded-md px-1.5 py-0.5">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            )}
            <Button 
              type="submit" 
              size="sm" 
              className="gap-1.5 bg-primary hover:bg-primary/90 rounded-xl px-4 h-8 shadow-md shadow-primary/20"
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {isLoading ? 'Thinking...' : 'Ask'}
            </Button>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold px-3 py-2">Suggested queries</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-xs text-foreground/80 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors flex items-center gap-2.5"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Result feedback */}
      {result && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/15 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary truncate">{result.title}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{result.explanation}</p>
          </div>
          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider shrink-0 bg-primary/10 text-primary border-primary/20">
            {result.chartType.replace(/_/g, ' ')}
          </Badge>
          {onClearResult && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg hover:bg-primary/10" onClick={onClearResult}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}