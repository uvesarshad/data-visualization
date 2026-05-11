'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Check } from 'lucide-react';

interface SaveAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  rowCount: number;
  columnCount: number;
  onSave: (name: string) => Promise<void>;
}

export function SaveAnalysisDialog({ open, onOpenChange, fileName, rowCount, columnCount, onSave }: SaveAnalysisDialogProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const analysisName = name.trim() || `${fileName} — ${new Date().toLocaleDateString()}`;
    setSaving(true);
    try {
      await onSave(analysisName);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setName('');
        onOpenChange(false);
      }, 1200);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) { setName(''); setSaved(false); } } }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-lg">Save Analysis</DialogTitle>
          <DialogDescription>
            Save your current analysis to resume later. All data, charts, and AI insights will be preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Analysis Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${fileName} — ${new Date().toLocaleDateString()}`}
              className="rounded-xl"
              disabled={saving || saved}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-[10px]">{rowCount.toLocaleString()} rows</Badge>
            <Badge variant="secondary" className="text-[10px]">{columnCount} columns</Badge>
            <Badge variant="secondary" className="text-[10px]">{fileName}</Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || saved} className="rounded-xl gap-2">
            {saved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}