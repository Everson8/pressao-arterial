import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BPStatusCard, BPBadge } from "@/components/BPBadge";
import { classifyBloodPressure } from "../../../shared/bloodPressure";
import { Activity, ArrowRight, Clock, Heart, Plus, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  color = "default",
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "stable";
  color?: "default" | "success" | "warning" | "danger";
}) {
  const colorClasses = {
    default: "text-primary bg-primary/10",
    success: "text-emerald-600 bg-emerald-100",
    warning: "text-amber-600 bg-amber-100",
    danger: "text-red-600 bg-red-100",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-red-500" : trend === "down" ? "text-emerald-500" : "text-muted-foreground";

  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            {trend && (
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: latest, isLoading: loadingLatest } = trpc.readings.latest.useQuery();
  const { data: stats, isLoading: loadingStats } = trpc.readings.stats.useQuery({});
  const { data: recentData, isLoading: loadingRecent } = trpc.readings.list.useQuery({
    limit: 5,
    offset: 0,
  });

  const latestClassification = useMemo(() => {
    if (!latest) return null;
    return classifyBloodPressure(latest.systolic, latest.diastolic);
  }, [latest]);

  const avgClassification = useMemo(() => {
    if (!stats) return null;
    return classifyBloodPressure(stats.avgSystolic, stats.avgDiastolic);
  }, [stats]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {greeting()}, {user?.name?.split(" ")[0] ?? "usuário"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button
          onClick={() => setLocation("/nova-medicao")}
          size="sm"
          className="gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Medir
        </Button>
      </div>

      {/* Última medição */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Última Medição
          </h2>
          {latest && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(latest.measuredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>

        {loadingLatest ? (
          <Skeleton className="h-36 w-full rounded-2xl" />
        ) : latest ? (
          <BPStatusCard
            systolic={latest.systolic}
            diastolic={latest.diastolic}
            heartRate={latest.heartRate}
          />
        ) : (
          <Card className="border-dashed border-2 shadow-none">
            <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Activity className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Nenhuma medição registrada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registre sua primeira medição para começar o monitoramento.
                </p>
              </div>
              <Button onClick={() => setLocation("/nova-medicao")} size="sm" className="mt-1">
                <Plus className="w-4 h-4 mr-1.5" />
                Registrar medição
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Estatísticas */}
      {(loadingStats || stats) && (
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            Estatísticas Gerais
          </h2>
          {loadingStats ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Sistólica Média"
                value={stats.avgSystolic}
                unit="mmHg"
                icon={TrendingUp}
                color={avgClassification?.category === "normal" ? "success" :
                  avgClassification?.category === "elevated" ? "default" : "warning"}
              />
              <StatCard
                title="Diastólica Média"
                value={stats.avgDiastolic}
                unit="mmHg"
                icon={TrendingDown}
                color={avgClassification?.category === "normal" ? "success" :
                  avgClassification?.category === "elevated" ? "default" : "warning"}
              />
              {stats.avgHeartRate && (
                <StatCard
                  title="Freq. Cardíaca Média"
                  value={stats.avgHeartRate}
                  unit="bpm"
                  icon={Heart}
                  color="default"
                />
              )}
              <StatCard
                title="Total de Medições"
                value={stats.totalReadings}
                icon={Activity}
                color="default"
              />
            </div>
          ) : null}
        </section>
      )}

      {/* Medições recentes */}
      {(loadingRecent || (recentData?.rows && recentData.rows.length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Medições Recentes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/historico")}
              className="text-xs h-7 gap-1"
            >
              Ver todas
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          {loadingRecent ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <Card className="shadow-sm border-border/60 overflow-hidden">
              <div className="divide-y divide-border/60">
                {recentData?.rows.map((reading) => {
                  const cls = classifyBloodPressure(reading.systolic, reading.diastolic);
                  return (
                    <div key={reading.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          cls.category === "normal" ? "bg-emerald-500" :
                          cls.category === "elevated" ? "bg-blue-500" :
                          cls.category === "hypertension_stage1" ? "bg-amber-500" :
                          cls.category === "hypertension_stage2" ? "bg-orange-500" :
                          "bg-red-500"
                        }`} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {reading.systolic}/{reading.diastolic}
                            <span className="text-xs font-normal text-muted-foreground ml-1">mmHg</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(reading.measuredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <BPBadge systolic={reading.systolic} diastolic={reading.diastolic} size="sm" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>
      )}

      {/* Guia de classificação */}
      <section>
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Classificação da Pressão Arterial</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {[
                { label: "Normal", range: "< 120/80 mmHg", color: "bg-emerald-500" },
                { label: "Elevada", range: "120–129 / < 80 mmHg", color: "bg-blue-500" },
                { label: "Hipertensão 1", range: "130–139 / 80–89 mmHg", color: "bg-amber-500" },
                { label: "Hipertensão 2", range: "≥ 140 / ≥ 90 mmHg", color: "bg-orange-500" },
                { label: "Crise Hipertensiva", range: "> 180 / > 120 mmHg", color: "bg-red-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                  <span className="text-xs font-medium text-foreground w-32 shrink-0">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.range}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
