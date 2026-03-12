import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { ArrowLeft, Bell, Clock, Trash2, Plus } from "lucide-react";
import { useLocation } from "wouter";

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sab" },
];

export default function Lembretes() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: reminders, isLoading } = trpc.reminders.list.useQuery();
  const createMutation = trpc.reminders.create.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      toast.success("Lembrete criado com sucesso!");
      resetForm();
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });
  const deleteMutation = trpc.reminders.delete.useMutation({
    onSuccess: () => {
      utils.reminders.list.invalidate();
      toast.success("Lembrete removido.");
      setDeleteId(null);
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTime("08:00");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe um título para o lembrete.");
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      time,
      daysOfWeek: selectedDays,
    });
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

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
            <Bell className="w-5 h-5 text-muted-foreground" />
            Lembretes
          </h1>
          <p className="text-xs text-muted-foreground">Configure notificações para medir a pressão</p>
        </div>
      </div>

      {/* Formulário de novo lembrete */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Novo Lembrete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Ex: Medir pressão pela manhã"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição (opcional)
              </Label>
              <Textarea
                id="description"
                placeholder="Ex: Após acordar, antes do café"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Horário <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Dias da Semana</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold transition-colors ${
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Criando..." : "Criar Lembrete"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de lembretes */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Seus Lembretes
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : !reminders || reminders.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-foreground">Nenhum lembrete criado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie um lembrete para receber notificações sobre medições.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-border/60 overflow-hidden">
            <div className="divide-y divide-border/60">
              {reminders.map((reminder) => {
                const days = reminder.daysOfWeek
                  .split(",")
                  .map(Number)
                  .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
                  .join(", ");

                return (
                  <div key={reminder.id} className="flex items-start justify-between p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{reminder.title}</span>
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {reminder.time}
                        </span>
                      </div>
                      {reminder.description && (
                        <p className="text-xs text-muted-foreground mb-2">{reminder.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70">{days}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 ml-2"
                      onClick={() => setDeleteId(reminder.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lembrete?</AlertDialogTitle>
            <AlertDialogDescription>
              Este lembrete será removido e você não receberá mais notificações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
