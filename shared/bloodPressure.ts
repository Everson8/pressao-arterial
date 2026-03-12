/**
 * Classificação da pressão arterial conforme diretrizes da
 * American Heart Association (AHA) e Sociedade Brasileira de Cardiologia (SBC).
 */

export type BPCategory =
  | "normal"
  | "elevated"
  | "hypertension_stage1"
  | "hypertension_stage2"
  | "hypertensive_crisis";

export interface BPClassification {
  category: BPCategory;
  label: string;
  labelShort: string;
  description: string;
  color: string;       // Tailwind text color class
  bgColor: string;     // Tailwind bg color class
  borderColor: string; // Tailwind border color class
  badgeColor: string;  // Tailwind badge bg color
}

export function classifyBloodPressure(
  systolic: number,
  diastolic: number
): BPClassification {
  // Crise hipertensiva: sistólica > 180 e/ou diastólica > 120
  if (systolic > 180 || diastolic > 120) {
    return {
      category: "hypertensive_crisis",
      label: "Crise Hipertensiva",
      labelShort: "Crise",
      description: "Procure atendimento médico imediatamente.",
      color: "text-red-700",
      bgColor: "bg-red-50",
      borderColor: "border-red-300",
      badgeColor: "bg-red-600",
    };
  }

  // Hipertensão estágio 2: sistólica ≥ 140 e/ou diastólica ≥ 90
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: "hypertension_stage2",
      label: "Hipertensão Estágio 2",
      labelShort: "Hipert. 2",
      description: "Consulte um médico para avaliação e tratamento.",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-300",
      badgeColor: "bg-orange-500",
    };
  }

  // Hipertensão estágio 1: sistólica 130–139 e/ou diastólica 80–89
  if (systolic >= 130 || diastolic >= 80) {
    return {
      category: "hypertension_stage1",
      label: "Hipertensão Estágio 1",
      labelShort: "Hipert. 1",
      description: "Monitore regularmente e adote hábitos saudáveis.",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-300",
      badgeColor: "bg-yellow-500",
    };
  }

  // Elevada: sistólica 120–129 e diastólica < 80
  if (systolic >= 120 && diastolic < 80) {
    return {
      category: "elevated",
      label: "Pressão Elevada",
      labelShort: "Elevada",
      description: "Atenção: adote hábitos de vida mais saudáveis.",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      badgeColor: "bg-blue-500",
    };
  }

  // Normal: sistólica < 120 e diastólica < 80
  return {
    category: "normal",
    label: "Normal",
    labelShort: "Normal",
    description: "Pressão arterial dentro dos valores ideais.",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    badgeColor: "bg-emerald-500",
  };
}

export function formatBP(systolic: number, diastolic: number): string {
  return `${systolic}/${diastolic} mmHg`;
}

export interface BPStats {
  avgSystolic: number;
  avgDiastolic: number;
  avgHeartRate: number | null;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  totalReadings: number;
}
