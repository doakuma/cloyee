"use client";

import { useState } from "react";

export default function ChoiceButtons({ choices, onSelect, answer }) {
  const [selected, setSelected] = useState(null);

  if (!choices?.length) return null;

  function handleClick(e, choice) {
    e.stopPropagation();
    if (selected) return;
    setSelected(choice);
    setTimeout(() => {
      onSelect(choice);
    }, 300);
  }

  const hasAnswer = answer != null && answer >= 0;

  return (
    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
      {choices.map((choice, i) => {
        const isSelected = selected === choice;
        const isDimmed = selected !== null && !isSelected;
        const isCorrect = hasAnswer && i === answer;

        let cls = "text-left px-3 py-2 text-sm border rounded-lg transition-all duration-200 ";

        if (selected !== null && hasAnswer) {
          if (isCorrect) {
            cls += "bg-green-50 text-green-700 border-green-400 font-medium";
          } else if (isSelected) {
            cls += "bg-red-50 text-red-700 border-red-400 font-medium";
          } else {
            cls += "opacity-30 cursor-not-allowed border-border";
          }
        } else if (isSelected) {
          cls += "bg-foreground text-background border-foreground font-medium";
        } else if (isDimmed) {
          cls += "opacity-30 cursor-not-allowed border-border";
        } else {
          cls += "border-border hover:bg-muted";
        }

        return (
          <button
            key={i}
            onClick={(e) => handleClick(e, choice)}
            disabled={!!selected}
            className={cls}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
