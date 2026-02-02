import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number;
}

function getProgressColor(value: number) {
  if (value === 0) return "bg-orange-500";       // parado
  if (value < 20) return "bg-emerald-300";      // início
  if (value < 40) return "bg-emerald-400";
  if (value < 60) return "bg-emerald-500";
  if (value < 80) return "bg-emerald-600";
  return "bg-emerald-700";                      // quase / concluído
}



function Progress({ className, value = 0, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        "h-3 bg-slate-200",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all duration-500",
          getProgressColor(value)
        )}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
