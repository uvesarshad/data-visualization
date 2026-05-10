'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, Loader2, X, ChevronRight } from 'lucide-react';
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
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder='Ask anything about your data... e.g. "Show revenue by region"'
              className="w-full bg-card/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            size="sm" 
            className="gap-1.5 bg-accent hover:bg-accent/80 text-white rounded-xl px-4"
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Ask
          </Button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-lg border border-border rounded-xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1">Try asking</p>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-foreground/80 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors flex items-center gap-2"
                onMouseDown={() => handleSuggestionClick(s)}
              >
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Result feedback */}
      {result && (
        <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/15 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-primary truncate">{result.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{result.explanation}</p>
          </div>
          <Badge variant="secondary" className="text-[8px] uppercase tracking-widest shrink-0">
            {result.chartType.replace(/_/g, ' ')}
          </Badge>
          {onClearResult && (
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={onClearResult}>
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}