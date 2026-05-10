'use client';

// 4.4: Virtualized data table using @tanstack/react-virtual
// Handles 100K+ rows without DOM bloat

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VirtualizedTableProps {
  data: any[];
  columns: string[];
  maxRows?: number;
}

export function VirtualizedTable({ data, columns, maxRows = 1000 }: VirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = data.slice(0, maxRows);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // estimated row height in px
    overscan: 10,
  });

  return (
    <div className="border border-border bg-card/30 rounded-xl overflow-hidden">
      {/* Fixed header */}
      <Table>
        <TableHeader className="bg-card/80 backdrop-blur">
          <TableRow className="hover:bg-transparent">
            {columns.map((key) => (
              <TableHead key={key} className="font-headline font-bold text-primary uppercase text-[9px] tracking-widest py-4">
                {key}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      {/* Virtualized body */}
      <div ref={parentRef} className="max-h-[65vh] overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          <Table>
            <TableBody>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow
                    key={virtualRow.index}
                    className="hover:bg-primary/5 transition-colors border-border/20 absolute w-full"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {columns.map((col, vIdx) => (
                      <TableCell key={vIdx} className="text-xs py-2 font-medium opacity-80">
                        {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '').substring(0, 30)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/30 bg-card/10 text-center text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
        Showing {rows.length.toLocaleString()} of {data.length.toLocaleString()} records (virtualized)
      </div>
    </div>
  );
}