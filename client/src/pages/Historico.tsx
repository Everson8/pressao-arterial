import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BPBadge } from "@/components/BPBadge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { ClipboardList, Download, FileText, Heart, Trash2 } from "lucide-react";
import { classifyBloodPressure } from "../../../shared/bloodPressure";

type PeriodFilter = "7d" | "30d" | "90d" | "all";

function getPeriodDates(period: PeriodFilter): { from?: Date; to?: Date } {
  const now = new Date();
  if (period === "7d") return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
  if (period === "30d") return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
  if (period === "90d") return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) };
  return {};
}

export default function Historico() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { from, to } = useMemo(() => getPeriodDates(period), [period]);

  const { data, isLoading } = trpc.readings.list.useQuery({
    from,
    to,
    limit: 200,
    offset: 0,
  });

  const { data: stats } = trpc.readings.stats.useQuery({ from, to });

  const deleteMutation = trpc.readings.delete.useMutation({
    onSuccess: () => {
      utils.readings.list.invalidate();
      utils.readings.stats.invalidate();
      utils.readings.latest.invalidate();
      toast.success("Medição excluída.");
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error("Erro ao excluir: " + err.message);
    },
  });

  const handleExportPDF = async () => {
    if (!data?.rows || data.rows.length === 0) {
      toast.error("Nenhuma medição para exportar.");
      return;
    }

    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(42, 58, 142);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Pressão Arterial", 14, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Paciente: ${user?.name ?? "Usuário"}`, 14, 27);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 34);

      const periodLabels: Record<PeriodFilter, string> = {
        "7d": "Últimos 7 dias",
        "30d": "Últimos 30 dias",
        "90d": "Últimos 3 meses",
        "all": "Todo o período",
      };
      doc.text(`Período: ${periodLabels[period]}`, pageWidth - 14, 27, { align: "right" });

      // Stats summary
      if (stats) {
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Resumo Estatístico", 14, 52);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Média: ${stats.avgSystolic}/${stats.avgDiastolic} mmHg`, 14, 60);
        doc.text(`Mínima: ${stats.minSystolic}/${stats.minDiastolic} mmHg`, 70, 60);
        doc.text(`Máxima: ${stats.maxSystolic}/${stats.maxDiastolic} mmHg`, 126, 60);
        doc.text(`Total de medições: ${stats.totalReadings}`, 14, 67);
        if (stats.avgHeartRate) doc.text(`FC média: ${stats.avgHeartRate} bpm`, 70, 67);
      }

      // Table
      const tableData = data.rows.map((r) => {
        const cls = classifyBloodPressure(r.systolic, r.diastolic);
        return [
          format(new Date(r.measuredAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          `${r.systolic}/${r.diastolic}`,
          r.heartRate ? `${r.heartRate} bpm` : "—",
          cls.label,
          r.notes ?? "—",
        ];
      });

      autoTable(doc, {
        startY: stats ? 74 : 52,
        head: [["Data/Hora", "Pressão (mmHg)", "Freq. Cardíaca", "Classificação", "Observações"]],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [42, 58, 142], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 28, halign: "center" },
          2: { cellWidth: 28, halign: "center" },
          3: { cellWidth: 38 },
          4: { cellWidth: "auto" },
        },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount} — Sistema de Monitoramento de Pressão Arterial`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      }

      doc.save(`pressao-arterial-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório exportado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar PDF. Tente novamente.");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-muted-foreground" />
            Histórico
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} medição${total !== 1 ? "ões" : ""} encontrada${total !== 1 ? "s" : ""}` : "Nenhuma medição no período"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={isExporting || rows.length === 0}
          className="gap-1.5"
        >
          {isExporting ? (
            <span className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          PDF
        </Button>
      </div>

      {/* Filtro de período */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">Período:</span>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 3 meses</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats do período */}
      {stats && (
        <Card className="shadow-sm border-border/60 bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Média</p>
                <p className="text-base font-bold text-foreground">{stats.avgSystolic}/{stats.avgDiastolic}</p>
                <p className="text-xs text-muted-foreground">mmHg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Mínima</p>
                <p className="text-base font-bold text-foreground">{stats.minSystolic}/{stats.minDiastolic}</p>
                <p className="text-xs text-muted-foreground">mmHg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Máxima</p>
                <p className="text-base font-bold text-foreground">{stats.maxSystolic}/{stats.maxDiastolic}</p>
                <p className="text-xs text-muted-foreground">mmHg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">Nenhuma medição encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Não há medições registradas para o período selecionado.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border/60 overflow-hidden">
          <div className="divide-y divide-border/60">
            {rows.map((reading) => {
              const cls = classifyBloodPressure(reading.systolic, reading.diastolic);
              return (
                <div key={reading.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors group">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    cls.category === "normal" ? "bg-emerald-500" :
                    cls.category === "elevated" ? "bg-blue-500" :
                    cls.category === "hypertension_stage1" ? "bg-amber-500" :
                    cls.category === "hypertension_stage2" ? "bg-orange-500" :
                    "bg-red-500"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {reading.systolic}/{reading.diastolic}
                        <span className="text-xs font-normal text-muted-foreground ml-1">mmHg</span>
                      </span>
                      {reading.heartRate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" />
                          {reading.heartRate} bpm
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(reading.measuredAt), "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {reading.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{reading.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <BPBadge systolic={reading.systolic} diastolic={reading.diastolic} size="sm" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(reading.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir medição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A medição será removida permanentemente do seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
