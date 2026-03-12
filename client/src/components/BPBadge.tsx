import { classifyBloodPressure } from "../../../shared/bloodPressure";
import { cn } from "@/lib/utils";

interface BPBadgeProps {
  systolic: number;
  diastolic: number;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

export function BPBadge({ systolic, diastolic, size = "md", showDescription = false }: BPBadgeProps) {
  const classification = classifyBloodPressure(systolic, diastolic);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 rounded-full",
    md: "text-xs px-2.5 py-1 rounded-full font-medium",
    lg: "text-sm px-3 py-1.5 rounded-full font-semibold",
  };

  const colorMap: Record<string, string> = {
    normal: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    elevated: "bg-blue-100 text-blue-800 border border-blue-200",
    hypertension_stage1: "bg-amber-100 text-amber-800 border border-amber-200",
    hypertension_stage2: "bg-orange-100 text-orange-800 border border-orange-200",
    hypertensive_crisis: "bg-red-100 text-red-800 border border-red-200 animate-pulse",
  };

  return (
    <div className="flex flex-col gap-1">
      <span className={cn(sizeClasses[size], colorMap[classification.category])}>
        {classification.labelShort}
      </span>
      {showDescription && (
        <p className="text-xs text-muted-foreground">{classification.description}</p>
      )}
    </div>
  );
}

interface BPStatusCardProps {
  systolic: number;
  diastolic: number;
  heartRate?: number | null;
}

export function BPStatusCard({ systolic, diastolic, heartRate }: BPStatusCardProps) {
  const classification = classifyBloodPressure(systolic, diastolic);

  const bgMap: Record<string, string> = {
    normal: "from-emerald-50 to-emerald-100/50 border-emerald-200",
    elevated: "from-blue-50 to-blue-100/50 border-blue-200",
    hypertension_stage1: "from-amber-50 to-amber-100/50 border-amber-200",
    hypertension_stage2: "from-orange-50 to-orange-100/50 border-orange-200",
    hypertensive_crisis: "from-red-50 to-red-100/50 border-red-200",
  };

  const textMap: Record<string, string> = {
    normal: "text-emerald-700",
    elevated: "text-blue-700",
    hypertension_stage1: "text-amber-700",
    hypertension_stage2: "text-orange-700",
    hypertensive_crisis: "text-red-700",
  };

  const dotMap: Record<string, string> = {
    normal: "bg-emerald-500",
    elevated: "bg-blue-500",
    hypertension_stage1: "bg-amber-500",
    hypertension_stage2: "bg-orange-500",
    hypertensive_crisis: "bg-red-500",
  };

  return (
    <div className={cn(
      "rounded-2xl border bg-gradient-to-br p-5",
      bgMap[classification.category]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full", dotMap[classification.category],
              classification.category === "hypertensive_crisis" && "animate-pulse"
            )} />
            <span className={cn("text-sm font-semibold", textMap[classification.category])}>
              {classification.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            {classification.description}
          </p>
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <div className={cn("text-4xl font-bold tracking-tight", textMap[classification.category])}>
            {systolic}<span className="text-2xl font-medium opacity-70">/{diastolic}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">mmHg</div>
        </div>
        {heartRate && (
          <div className="mb-1">
            <div className="text-lg font-semibold text-foreground">{heartRate}</div>
            <div className="text-xs text-muted-foreground">bpm</div>
          </div>
        )}
      </div>
    </div>
  );
}
