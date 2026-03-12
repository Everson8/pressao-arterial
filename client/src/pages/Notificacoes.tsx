import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Clock, Mail, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export default function Notificacoes() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: prefs, isLoading } = trpc.notifications.getPreferences.useQuery();
  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      utils.notifications.getPreferences.invalidate();
      toast.success("Preferências atualizadas!");
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const { data: logs } = trpc.notifications.getLogs.useQuery({ limit: 10 });

  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [weeklyDigestDay, setWeeklyDigestDay] = useState(1);
  const [weeklyDigestTime, setWeeklyDigestTime] = useState("09:00");

  useEffect(() => {
    if (prefs) {
      setReminderNotifications(prefs.reminderNotifications === 1);
      setWeeklyDigest(prefs.weeklyDigest === 1);
      setAlertNotifications(prefs.alertNotifications === 1);
      setWeeklyDigestDay(prefs.weeklyDigestDay);
      setWeeklyDigestTime(prefs.weeklyDigestTime);
    }
  }, [prefs]);

  const handleSave = () => {
    updateMutation.mutate({
      reminderNotifications,
      weeklyDigest,
      alertNotifications,
      weeklyDigestDay,
      weeklyDigestTime,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/perfil")}
          className="h-8 w-8 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5 text-muted-foreground" />
            Notificações por E-mail
          </h1>
          <p className="text-xs text-muted-foreground">Configure como você deseja receber notificações</p>
        </div>
      </div>

      {/* Preferências */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tipos de Notificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lembretes */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3 flex-1">
              <Bell className="w-4 h-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Lembretes de Medição</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receba e-mail nos horários dos seus lembretes
                </p>
              </div>
            </div>
            <Switch
              checked={reminderNotifications}
              onCheckedChange={setReminderNotifications}
            />
          </div>

          {/* Alertas */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-4 h-4 text-destructive mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Alertas de Valores Fora da Meta</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Notificação quando pressão sai dos limites definidos
                </p>
              </div>
            </div>
            <Switch
              checked={alertNotifications}
              onCheckedChange={setAlertNotifications}
            />
          </div>

          {/* Resumo Semanal */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3 flex-1">
              <Clock className="w-4 h-4 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Resumo Semanal</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receba um resumo das suas medições da semana
                </p>
              </div>
            </div>
            <Switch
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações do Resumo Semanal */}
      {weeklyDigest && (
        <Card className="shadow-sm border-border/60 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Configurar Resumo Semanal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="digest-day" className="text-sm font-medium">
                Dia da Semana
              </Label>
              <select
                id="digest-day"
                value={weeklyDigestDay}
                onChange={(e) => setWeeklyDigestDay(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="digest-time" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Horário
              </Label>
              <Input
                id="digest-time"
                type="time"
                value={weeklyDigestTime}
                onChange={(e) => setWeeklyDigestTime(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Salvar */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full"
      >
        {updateMutation.isPending ? "Salvando..." : "Salvar Preferências"}
      </Button>

      {/* Histórico de E-mails */}
      {logs && logs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Últimos E-mails Enviados
          </h2>
          <Card className="shadow-sm border-border/60 overflow-hidden">
            <div className="divide-y divide-border/60">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{log.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.recipientEmail}</p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-2 ${
                      log.status === "sent"
                        ? "bg-emerald-100 text-emerald-700"
                        : log.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {log.status === "sent" ? "Enviado" : log.status === "failed" ? "Erro" : "Pendente"}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </p>
                  {log.errorMessage && (
                    <p className="text-xs text-destructive mt-2">{log.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Dica */}
      <Card className="border-dashed shadow-none bg-blue-50/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Dica:</strong> Certifique-se de que o e-mail cadastrado na sua conta está correto para receber as notificações. Verifique sua pasta de spam se não receber os e-mails.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
