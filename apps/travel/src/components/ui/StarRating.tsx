import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  className?: string;
  iconClassName?: string;
}

export function StarRating({ rating, className = 'flex gap-0.5', iconClassName = 'h-3.5 w-3.5' }: StarRatingProps) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className={className} aria-hidden>
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <Star
          key={starIndex}
          className={`${iconClassName} shrink-0 ${starIndex <= roundedRating ? 'fill-brand-amber text-brand-amber' : 'text-muted/60'}`}
        />
      ))}
    </div>
  );
}
