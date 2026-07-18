import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = ({ className, value = 0, ...props }: ProgressProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    >
      <div
        className="h-full bg-foreground transition-all duration-300 ease-in-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};

export { Progress };
