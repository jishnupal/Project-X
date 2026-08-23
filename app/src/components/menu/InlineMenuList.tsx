import { useEffect, useRef, useState } from "react";
import { cn } from "../../design-system/cn";

type InlineMenuListProps = {
  items: string[];
  onChange: (items: string[]) => void;
  variant?: "featured" | "featured-live" | "mini";
  inputSize?: "xs" | "sm";
  bulletClassName?: string;
};

function withTrailingRow(items: string[]): string[] {
  if (!items.length) return [""];
  return items[items.length - 1] === "" ? items : [...items, ""];
}

function withoutTrailingRow(rows: string[]): string[] {
  if (!rows.length) return [];
  if (rows[rows.length - 1] === "") return rows.slice(0, -1);
  return rows;
}

export function InlineMenuList({
  items,
  onChange,
  variant = "mini",
  inputSize = "sm",
  bulletClassName,
}: InlineMenuListProps) {
  const [rows, setRows] = useState(() => withTrailingRow(items));
  const listRef = useRef<HTMLUListElement>(null);
  const serialized = items.join("\x1e");
  const lastSerialized = useRef(serialized);

  useEffect(() => {
    if (lastSerialized.current !== serialized) {
      lastSerialized.current = serialized;
      setRows(withTrailingRow(items));
    }
  }, [serialized, items]);

  const commit = (nextRows: string[]) => {
    setRows(nextRows);
    const committed = withoutTrailingRow(nextRows);
    lastSerialized.current = committed.join("\x1e");
    onChange(committed);
  };

  const focusInput = (index: number) => {
    requestAnimationFrame(() => {
      const input = listRef.current?.querySelectorAll("input")[index] as
        | HTMLInputElement
        | undefined;
      input?.focus();
    });
  };

  const updateRow = (index: number, value: string) => {
    const next = [...rows];
    next[index] = value;
    commit(next);
  };

  const removeAt = (index: number) => {
    const focusIndex = Math.max(0, index - 1);
    if (rows.length <= 1) {
      commit([""]);
      focusInput(0);
      return;
    }
    const next = rows.filter((_, i) => i !== index);
    commit(next);
    requestAnimationFrame(() => {
      const input = listRef.current?.querySelectorAll("input")[focusIndex] as
        | HTMLInputElement
        | undefined;
      if (!input) return;
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Enter") {
      event.preventDefault();
      const next = [...rows];
      if (index === next.length - 1) {
        if (!next[index].trim()) return;
        next.push("");
      } else {
        next.splice(index + 1, 0, "");
      }
      commit(next);
      focusInput(index + 1);
      return;
    }

    if (event.key === "Backspace" && event.currentTarget.value === "" && rows.length > 1) {
      event.preventDefault();
      removeAt(index);
    }
  };

  const isFeatured = variant === "featured" || variant === "featured-live";
  const isLive = variant === "featured-live";

  return (
    <ul
      ref={listRef}
      className={cn("menu-list", isFeatured ? "space-y-1" : "space-y-0.5")}
      data-type={isFeatured ? "categorized" : "single"}
    >
      {rows.map((item, index) => (
        <li
          key={index}
          className={cn(
            "flex items-center",
            isFeatured ? "gap-2" : "gap-1.5",
            isLive && "bg-tertiary-container/10 rounded-lg px-2 py-0.5",
          )}
        >
          <span
            className={cn(
              "rounded-full shrink-0",
              isFeatured
                ? isLive
                  ? "w-1 h-1 bg-tertiary-fixed/60"
                  : "w-1 h-1 bg-white/40"
                : "w-1 h-1 bg-primary/30",
              bulletClassName,
            )}
          />
          <input
            className={cn(
              "menu-item-input bg-transparent border-none p-0 focus:ring-0 w-full outline-none min-w-0",
              isFeatured
                ? cn("text-white text-xs", isLive && "font-medium")
                : cn(
                    "small-card-input text-on-surface",
                    inputSize === "xs" ? "text-xs" : "text-sm",
                  ),
              !item && index === rows.length - 1 && !isFeatured && "text-secondary/40",
            )}
            value={item}
            onChange={(e) => updateRow(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            placeholder={!item && index === rows.length - 1 ? "Add item..." : undefined}
            spellCheck={false}
          />
        </li>
      ))}
    </ul>
  );
}
