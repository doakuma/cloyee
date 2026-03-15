"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import RoadmapCard from "@/components/study/RoadmapCard";

export default function ArchivedSection({ roadmaps }) {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        보관된 로드맵 ({roadmaps.length}개)
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps.map((rm) => (
            <RoadmapCard key={rm.id} roadmap={rm} variant="paused" />
          ))}
        </div>
      )}
    </section>
  );
}
