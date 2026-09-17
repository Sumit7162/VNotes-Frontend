import { LayoutGrid, List } from "lucide-react";

import { cn } from "@/lib/utils";

export type NotesView = "list" | "grid";

interface ViewToggleProps {
  value: NotesView;
  onChange: (view: NotesView) => void;
}

const options: { view: NotesView; label: string; icon: typeof List }[] = [
  { view: "list", label: "List view", icon: List },
  { view: "grid", label: "Grid view", icon: LayoutGrid },
];

/**
 * Segmented list/grid switch.
 *
 * A hairline-bordered pair rather than a tinted pill with a tick: the choice is
 * a minor one, and the control should not weigh more than the content it
 * arranges. The active side is a filled block, which is legible at this size
 * without needing a second marker.
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Notes layout"
      className="inline-flex items-stretch overflow-hidden rounded-md border border-line"
    >
      {options.map(({ view, label, icon: Icon }, index) => {
        const active = value === view;
        return (
          <button
            key={view}
            type="button"
            onClick={() => onChange(view)}
            aria-pressed={active}
            title={label}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              index > 0 && "border-l border-line",
              active
                ? "bg-paper-200 text-ink-900"
                : "text-ink-400 hover:bg-paper-200/60 hover:text-ink-700",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
