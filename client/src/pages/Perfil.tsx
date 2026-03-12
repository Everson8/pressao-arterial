import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Bell, Heart, Save, User } from "lucide-react";
import { useLocation } from "wouter";

export default function Perfil() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: goals, isLoading: loadingGoals } = trpc.goals.get.useQuery();
  const updateMutation = trpc.goals.update.useMutation({
    onSuccess: () => {
      utils.goals.get.invalidate();
      toast.success("Metas atualizadas com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao atualizar metas: " + err.message);
    },
  });

  const [targetSystolic, setTargetSystolic] = useState(() => String(goals?.targetSystolic ?? 130));
  const [targetDiastolic, setTargetDiastolic] = useState(() => String(goals?.targetDiastolic ?? 80));
  const [alertSystolic, setAlertSystolic] = useState(() => String(goals?.alertThresholdSystolic ?? 140));
  const [alertDiastolic, setAlertDiastolic] = useState(() => String(goals?.alertThresholdDiastolic ?? 90));

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const tSys = Number(targetSystolic);
    const tDias = Number(targetDiastolic);
    const aSys = Number(alertSystolic);
    const aDias = Number(alertDiastolic);

    if (!tSys || !tDias || !aSys || !aDias) {
      toast.error("Preencha todos os campos com valores válidos.");
      return;
    }

    if (tSys >= aSys || tDias >= aDias) {
      toast.error("A meta deve ser menor que o limite de alerta.");
      return;
    }

    updateMutation.mutate({
      targetSystolic: tSys,
      targetDiastolic: tDias,
      alertThresholdSystolic: aSys,
      alertThresholdDiastolic: aDias,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="h-8 w-8 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            Perfil
          </h1>
          <p className="text-xs text-muted-foreground">Gerencie suas informações e metas de saúde</p>
        </div>
      </div>

      {/* Informações do usuário */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome</Label>
            <div className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground">
              {user?.name || "Usuário"}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">E-mail</Label>
            <div className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground break-all">
              {user?.email || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metas de Pressão Arterial */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Metas de Pressão Arterial
          </CardTitle>
          <CardDescription className="text-xs">
            Defina suas metas pessoais e limites de alerta para monitoramento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingGoals ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (
            <form onSubmit={handleSaveGoals} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetSys" className="text-sm font-medium">
                    Meta Sistólica <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="targetSys"
                      type="number"
                      value={targetSystolic}
                      onChange={(e) => setTargetSystolic(e.target.value)}
                      min={100}
                      max={200}
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      mmHg
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Seu objetivo ideal</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDias" className="text-sm font-medium">
                    Meta Diastólica <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="targetDias"
                      type="number"
                      value={targetDiastolic}
                      onChange={(e) => setTargetDiastolic(e.target.value)}
                      min={60}
                      max={130}
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      mmHg
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Seu objetivo ideal</p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">Limites de Alerta</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="alertSys" className="text-sm font-medium">
                      Alerta Sistólica <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="alertSys"
                        type="number"
                        value={alertSystolic}
                        onChange={(e) => setAlertSystolic(e.target.value)}
                        min={100}
                        max={220}
                        className="pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        mmHg
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Acima disto = alerta</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alertDias" className="text-sm font-medium">
                      Alerta Diastólica <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="alertDias"
                        type="number"
                        value={alertDiastolic}
                        onChange={(e) => setAlertDiastolic(e.target.value)}
                        min={60}
                        max={150}
                        className="pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        mmHg
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Acima disto = alerta</p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    Salvar Metas
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Dica */}
      <Card className="border-dashed shadow-none bg-blue-50/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Recomendação:</strong> Conforme as diretrizes da Sociedade Brasileira de Cardiologia, uma meta ideal é manter a pressão abaixo de 130/80 mmHg. Os limites de alerta ajudam você a identificar quando procurar orientação médica.
          </p>
        </CardContent>
      </Card>

      {/* Links rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => setLocation("/lembretes")}
          className="gap-2 h-12"
        >
          <Bell className="w-4 h-4" />
          <span className="text-xs">Lembretes</span>
        </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/compartilhar")}
                className="w-full justify-start"
              >
                <Heart className="w-4 h-4 mr-2" />
                Compartilhar com Médico
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/notificacoes")}
                className="w-full justify-start"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificações por E-mail
              </Button>
      </div>
    </div>
  );
}
