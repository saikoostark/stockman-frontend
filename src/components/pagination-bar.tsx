"use client";

import { Button } from "@/components/ui/button";

export function PaginationBar({
  label,
  prevLabel,
  nextLabel,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  label: string;
  prevLabel: string;
  nextLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!canPrev} onClick={onPrev}>
          {prevLabel}
        </Button>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
