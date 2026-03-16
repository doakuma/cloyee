export default function ChoiceButtons({ choices, onSelect }) {
  if (!choices?.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mt-2 flex-nowrap">
      {choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => onSelect(choice)}
          className="flex-shrink-0 px-3 py-1.5 text-sm border border-border rounded-full hover:bg-accent hover:border-primary transition-colors whitespace-nowrap"
        >
          {choice}
        </button>
      ))}
    </div>
  );
}
