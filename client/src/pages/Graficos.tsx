import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { classifyBloodPressure } from "../../../shared/bloodPressure";

type PeriodFilter = "7d" | "30d" | "90d" | "all";

function getPeriodDates(period: PeriodFilter): { from?: Date; to?: Date } {
  const now = new Date();
  if (period === "7d") return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
  if (period === "30d") return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
  if (period === "90d") return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) };
  return {};
}

const CATEGORY_COLORS: Record<string, string> = {
  normal: "#10b981",
  elevated: "#3b82f6",
  hypertension_stage1: "#f59e0b",
  hypertension_stage2: "#f97316",
  hypertensive_crisis: "#ef4444",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value} {entry.name === "FC" ? "bpm" : "mmHg"}</span>
        </div>
      ))}
    </div>
  );
};

export default function Graficos() {
  const [period, setPeriod] = useState<PeriodFilter>("30d");

  const { from, to } = useMemo(() => getPeriodDates(period), [period]);

  const { data, isLoading } = trpc.readings.list.useQuery({
    from,
    to,
    limit: 200,
    offset: 0,
  });

  const chartData = useMemo(() => {
    if (!data?.rows) return [];
    return [...data.rows]
      .reverse()
      .map((r) => ({
        date: format(new Date(r.measuredAt), "dd/MM", { locale: ptBR }),
        dateTime: format(new Date(r.measuredAt), "dd/MM HH:mm", { locale: ptBR }),
        Sistólica: r.systolic,
        Diastólica: r.diastolic,
        FC: r.heartRate ?? undefined,
        category: classifyBloodPressure(r.systolic, r.diastolic).category,
      }));
  }, [data]);

  const distributionData = useMemo(() => {
    if (!data?.rows) return [];
    const counts: Record<string, number> = {
      normal: 0,
      elevated: 0,
      hypertension_stage1: 0,
      hypertension_stage2: 0,
      hypertensive_crisis: 0,
    };
    data.rows.forEach((r) => {
      const cat = classifyBloodPressure(r.systolic, r.diastolic).category;
      counts[cat]++;
    });
    return [
      { name: "Normal", value: counts.normal, color: CATEGORY_COLORS.normal },
      { name: "Elevada", value: counts.elevated, color: CATEGORY_COLORS.elevated },
      { name: "Hipert. 1", value: counts.hypertension_stage1, color: CATEGORY_COLORS.hypertension_stage1 },
      { name: "Hipert. 2", value: counts.hypertension_stage2, color: CATEGORY_COLORS.hypertension_stage2 },
      { name: "Crise", value: counts.hypertensive_crisis, color: CATEGORY_COLORS.hypertensive_crisis },
    ].filter((d) => d.value > 0);
  }, [data]);

  const hasHeartRate = useMemo(() => {
    return chartData.some((d) => d.FC !== undefined);
  }, [chartData]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            Gráficos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Evolução temporal da pressão arterial
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">3 meses</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gráfico de linha principal */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Evolução da Pressão Arterial
          </CardTitle>
          <CardDescription className="text-xs">
            Linhas de referência: sistólica normal &lt; 120 mmHg, diastólica normal &lt; 80 mmHg
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Nenhum dado para o período selecionado.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="dateTime"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[40, 200]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                {/* Linhas de referência */}
                <ReferenceLine y={120} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
                <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />
                <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} opacity={0.5} />

                <Line
                  type="monotone"
                  dataKey="Sistólica"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#4f46e5", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Diastólica"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#06b6d4", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de frequência cardíaca */}
      {hasHeartRate && (
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Frequência Cardíaca</CardTitle>
            <CardDescription className="text-xs">
              Linha de referência: zona normal 60–100 bpm
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData.filter((d) => d.FC !== undefined)} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="dateTime"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[40, 160]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={60} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
                  <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} opacity={0.6} />
                  <Line
                    type="monotone"
                    dataKey="FC"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Distribuição por classificação */}
      {distributionData.length > 0 && (
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribuição por Classificação</CardTitle>
            <CardDescription className="text-xs">
              Quantidade de medições por categoria no período
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distributionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs">
                          <p className="font-semibold text-foreground">{label}</p>
                          <p className="text-muted-foreground mt-1">
                            {payload[0]?.value} medição{(payload[0]?.value as number) !== 1 ? "ões" : ""}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legenda das linhas de referência */}
      <Card className="shadow-sm border-border/60 bg-muted/20">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-foreground mb-3">Linhas de Referência nos Gráficos</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { color: "#3b82f6", label: "Sistólica normal (120 mmHg)" },
              { color: "#10b981", label: "Diastólica normal (80 mmHg)" },
              { color: "#f97316", label: "Hipertensão sistólica (140 mmHg)" },
              { color: "#f59e0b", label: "Hipertensão diastólica (90 mmHg)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-6 h-0.5 shrink-0" style={{ backgroundColor: item.color, borderTop: `2px dashed ${item.color}` }} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
