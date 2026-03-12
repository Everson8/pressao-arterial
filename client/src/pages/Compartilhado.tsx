import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BPBadge } from "@/components/BPBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Heart, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function Compartilhado() {
  const [match, params] = useRoute("/compartilhado/:token");
  const [, setLocation] = useLocation();
  const token = (params?.token as string) || "";

  const { data, isLoading, error } = trpc.sharing.getByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 p-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-sm border-border/60">
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive/60" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Link Inválido ou Expirado</h1>
              <p className="text-sm text-muted-foreground mt-2">
                O link de compartilhamento não é mais válido. Solicite um novo link ao paciente.
              </p>
            </div>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { link, readings } = data;
  const sortedReadings = [...readings].reverse();

  return (
    <div className="max-w-2xl mx-auto space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Histórico de Pressão Arterial
          </h1>
          {link.doctorName && (
            <p className="text-xs text-muted-foreground mt-1">
              Compartilhado com: <strong>{link.doctorName}</strong>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <Lock className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700">Acesso Seguro</span>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {sortedReadings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-foreground">{sortedReadings.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Última</p>
              <p className="text-lg font-bold text-foreground">
                {sortedReadings[0]?.systolic}/{sortedReadings[0]?.diastolic}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Período</p>
              <p className="text-xs font-medium text-foreground">
                {sortedReadings.length > 1
                  ? `${Math.ceil((new Date(sortedReadings[0]!.measuredAt).getTime() - new Date(sortedReadings[sortedReadings.length - 1]!.measuredAt).getTime()) / (1000 * 60 * 60 * 24))} dias`
                  : "1 medição"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de medições */}
      {sortedReadings.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
            <Heart className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">Nenhuma medição registrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                O paciente ainda não registrou medições.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border/60 overflow-hidden">
          <div className="divide-y divide-border/60">
            {sortedReadings.map((reading) => (
              <div key={reading.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {reading.systolic}/{reading.diastolic} mmHg
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(reading.measuredAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <BPBadge systolic={reading.systolic} diastolic={reading.diastolic} />
                </div>
                {reading.heartRate && (
                  <p className="text-xs text-muted-foreground">
                    Frequência cardíaca: <strong>{reading.heartRate} bpm</strong>
                  </p>
                )}
                {reading.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Anotações: {reading.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rodapé */}
      <Card className="border-dashed shadow-none bg-blue-50/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Privacidade:</strong> Este link compartilhado é seguro e temporário. O paciente pode removê-lo a qualquer momento. Apenas o histórico de medições é visível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
