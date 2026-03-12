import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BPStatusCard } from "@/components/BPBadge";
import { classifyBloodPressure } from "../../../shared/bloodPressure";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Activity, ArrowLeft, CheckCircle2, Heart, Info } from "lucide-react";

export default function NovaMedicao() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [notes, setNotes] = useState("");
  const [measuredAt, setMeasuredAt] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });
  const [saved, setSaved] = useState(false);

  const createMutation = trpc.readings.create.useMutation({
    onSuccess: () => {
      utils.readings.latest.invalidate();
      utils.readings.list.invalidate();
      utils.readings.stats.invalidate();
      setSaved(true);
      toast.success("Medição registrada com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao registrar medição: " + err.message);
    },
  });

  const preview = useMemo(() => {
    const s = parseInt(systolic);
    const d = parseInt(diastolic);
    if (!isNaN(s) && !isNaN(d) && s > 0 && d > 0) {
      return classifyBloodPressure(s, d);
    }
    return null;
  }, [systolic, diastolic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseInt(systolic);
    const d = parseInt(diastolic);
    const hr = heartRate ? parseInt(heartRate) : undefined;

    if (isNaN(s) || isNaN(d)) {
      toast.error("Informe valores válidos para pressão sistólica e diastólica.");
      return;
    }
    if (s < 50 || s > 300) {
      toast.error("Pressão sistólica deve estar entre 50 e 300 mmHg.");
      return;
    }
    if (d < 30 || d > 200) {
      toast.error("Pressão diastólica deve estar entre 30 e 200 mmHg.");
      return;
    }

    createMutation.mutate({
      systolic: s,
      diastolic: d,
      heartRate: hr,
      notes: notes.trim() || undefined,
      measuredAt: new Date(measuredAt),
    });
  };

  const handleNewReading = () => {
    setSystolic("");
    setDiastolic("");
    setHeartRate("");
    setNotes("");
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    setMeasuredAt(new Date(now.getTime() - offset).toISOString().slice(0, 16));
    setSaved(false);
  };

  if (saved) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Medição registrada!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sua medição foi salva com sucesso no histórico.
              </p>
            </div>
            <div className="w-full mt-2">
              <BPStatusCard
                systolic={parseInt(systolic)}
                diastolic={parseInt(diastolic)}
                heartRate={heartRate ? parseInt(heartRate) : undefined}
              />
            </div>
            <div className="flex gap-3 w-full mt-2">
              <Button variant="outline" onClick={handleNewReading} className="flex-1">
                Nova medição
              </Button>
              <Button onClick={() => setLocation("/")} className="flex-1">
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
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
          <h1 className="text-lg font-semibold text-foreground">Nova Medição</h1>
          <p className="text-xs text-muted-foreground">Registre os valores da sua pressão arterial</p>
        </div>
      </div>

      {/* Preview em tempo real */}
      {preview && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <BPStatusCard
            systolic={parseInt(systolic)}
            diastolic={parseInt(diastolic)}
            heartRate={heartRate ? parseInt(heartRate) : undefined}
          />
        </div>
      )}

      {/* Formulário */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Valores da Medição
          </CardTitle>
          <CardDescription className="text-xs">
            Insira os valores exibidos no seu aparelho de pressão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Pressão arterial */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systolic" className="text-sm font-medium">
                  Sistólica <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    min={50}
                    max={300}
                    required
                    className="pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    mmHg
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Número maior (cima)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diastolic" className="text-sm font-medium">
                  Diastólica <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    min={30}
                    max={200}
                    required
                    className="pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    mmHg
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Número menor (baixo)</p>
              </div>
            </div>

            {/* Frequência cardíaca */}
            <div className="space-y-2">
              <Label htmlFor="heartRate" className="text-sm font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-red-500" />
                Frequência Cardíaca
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="72"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  min={30}
                  max={300}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  bpm
                </span>
              </div>
            </div>

            {/* Data e hora */}
            <div className="space-y-2">
              <Label htmlFor="measuredAt" className="text-sm font-medium">
                Data e Hora da Medição
              </Label>
              <Input
                id="measuredAt"
                type="datetime-local"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                required
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                Observações
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Ex: medido após repouso de 5 minutos, braço esquerdo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">{notes.length}/500</p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending || !systolic || !diastolic}
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Registrar Medição"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dica */}
      <Card className="border-dashed shadow-none bg-muted/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Dica:</strong> Para uma medição precisa, descanse por 5 minutos antes de medir, mantenha o braço na altura do coração e evite café ou exercícios 30 minutos antes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
