"use client";

import { useState } from "react";

export default function ChoiceButtons({ choices, onSelect }) {
  const [selected, setSelected] = useState(null);

  if (!choices?.length) return null;

  function handleClick(choice) {
    if (selected) return;
    setSelected(choice);
    setTimeout(() => {
      onSelect(choice);
    }, 300);
  }

  return (
    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
      {choices.map((choice, i) => {
        const isSelected = selected === choice;
        const isDimmed = selected !== null && !isSelected;
        return (
          <button
            key={i}
            onClick={() => handleClick(choice)}
            disabled={!!selected}
            className={`text-left px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
              isSelected
                ? "bg-foreground text-background border-foreground font-medium"
                : isDimmed
                ? "opacity-30 cursor-not-allowed border-border"
                : "border-border hover:bg-muted"
            }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
