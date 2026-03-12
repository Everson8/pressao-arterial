import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, Copy, Heart, Link as LinkIcon, Trash2, Plus, Check, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Compartilhar() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: links, isLoading } = trpc.sharing.list.useQuery();
  const createMutation = trpc.sharing.createLink.useMutation({
    onSuccess: () => {
      utils.sharing.list.invalidate();
      toast.success("Link de compartilhamento criado!");
      resetForm();
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });
  const deleteMutation = trpc.sharing.delete.useMutation({
    onSuccess: () => {
      utils.sharing.list.invalidate();
      toast.success("Link removido.");
      setDeleteId(null);
    },
    onError: (err) => toast.error("Erro: " + err.message),
  });

  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resetForm = () => {
    setDoctorName("");
    setDoctorEmail("");
    setExpiresInDays("30");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = Number(expiresInDays);
    if (!days || days < 1 || days > 365) {
      toast.error("Informe um período válido (1-365 dias).");
      return;
    }
    createMutation.mutate({
      doctorName: doctorName.trim() || undefined,
      doctorEmail: doctorEmail.trim() || undefined,
      expiresInDays: days,
    });
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/compartilhado/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
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
            <Heart className="w-5 h-5 text-muted-foreground" />
            Compartilhar com Médico
          </h1>
          <p className="text-xs text-muted-foreground">Crie links seguros para seu médico visualizar seu histórico</p>
        </div>
      </div>

      {/* Formulário de novo link */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Novo Link de Compartilhamento
          </CardTitle>
          <CardDescription className="text-xs">
            Gere um link temporário para seu médico acessar seu histórico sem precisar de login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName" className="text-sm font-medium">
                Nome do Médico (opcional)
              </Label>
              <Input
                id="doctorName"
                placeholder="Ex: Dr. João Silva"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorEmail" className="text-sm font-medium">
                E-mail do Médico (opcional)
              </Label>
              <Input
                id="doctorEmail"
                type="email"
                placeholder="Ex: joao@clinica.com"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                maxLength={320}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresInDays" className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Válido por (dias) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expiresInDays"
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                min={1}
                max={365}
              />
              <p className="text-xs text-muted-foreground">Após expirar, o link não funcionará mais.</p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Gerando..." : "Gerar Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de links */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-muted-foreground" />
          Links Ativos
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !links || links.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
              <LinkIcon className="w-10 h-10 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-foreground">Nenhum link criado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crie um link para compartilhar seu histórico com seu médico.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-border/60 overflow-hidden">
            <div className="divide-y divide-border/60">
              {links.map((link) => {
                const url = `${window.location.origin}/compartilhado/${link.token}`;
                const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                const isCopied = copiedId === link.token;

                return (
                  <div key={link.id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        {link.doctorName && (
                          <p className="text-sm font-semibold text-foreground">{link.doctorName}</p>
                        )}
                        {link.doctorEmail && (
                          <p className="text-xs text-muted-foreground">{link.doctorEmail}</p>
                        )}
                        {!link.doctorName && !link.doctorEmail && (
                          <p className="text-sm font-semibold text-muted-foreground">Link sem identificação</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setDeleteId(link.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isExpired
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {isExpired ? "Expirado" : "Ativo"}
                      </div>
                      {link.expiresAt && (
                        <span className="text-xs text-muted-foreground">
                          Expira em {format(new Date(link.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={url}
                        readOnly
                        className="text-xs bg-muted rounded px-2 py-1 flex-1 min-w-0 truncate text-muted-foreground"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link.token)}
                        className="shrink-0 gap-1.5 h-8"
                        disabled={isExpired || false}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="text-xs">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-xs">Copiar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Dica */}
      <Card className="border-dashed shadow-none bg-blue-50/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Segurança:</strong> Os links são únicos e temporários. Você pode removê-los a qualquer momento. Seu médico verá apenas o histórico de medições, sem acesso a outras informações pessoais.
          </p>
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover link?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu médico não conseguirá mais acessar o histórico através deste link.
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
