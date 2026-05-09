"use client";

import { useState } from "react";

import { ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

const ticketTypeLabels: Record<string, string> = {
  am_strategy: "AM 策略",
  am_data: "AM 數據",
  pm_custom: "PM 客製",
  as_material_confirm: "AS 素材確認",
  ds_proposal: "DS 提案",
  ds_material: "DS 素材",
  rd_tech_support: "RD 技術支援",
  mb_media_purchase: "MB 媒體採購",
};

const ticketStatusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "待處理", variant: "outline" },
  accepted: { label: "已接受", variant: "secondary" },
  processing: { label: "處理中", variant: "default" },
  completed: { label: "已完成", variant: "default" },
  rejected: { label: "已拒絕", variant: "destructive" },
};

interface TicketTrackerProps {
  quotationId: string;
}

export function TicketTracker({ quotationId }: TicketTrackerProps) {
  const [open, setOpen] = useState(false);
  const [ticketType, setTicketType] = useState<
    | "am_strategy"
    | "am_data"
    | "pm_custom"
    | "as_material_confirm"
    | "ds_proposal"
    | "ds_material"
    | "rd_tech_support"
    | "mb_media_purchase"
    | ""
  >("");

  const { data: tickets } = trpc.quotation.tickets.getByQuotation.useQuery({
    quotationId,
  });

  const createMutation = trpc.quotation.tickets.create.useMutation({
    onSuccess: () => {
      toast.success("工單已建立");
      setTicketType("");
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!ticketType) {
      toast.error("請選擇工單類型");
      return;
    }

    createMutation.mutate({
      quotationId,
      ticketType,
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">工單追蹤</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              建立工單
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>建立 Lark 工單</DialogTitle>
              <DialogDescription>選擇工單類型並推送到 Lark</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ticket-type" className="font-medium text-sm">
                  工單類型
                </label>
                <Select value={ticketType} onValueChange={(v) => setTicketType(v as typeof ticketType)}>
                  <SelectTrigger id="ticket-type">
                    <SelectValue placeholder="請選擇工單類型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ticketTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                建立
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">工單編號</TableHead>
            <TableHead className="w-[120px]">類型</TableHead>
            <TableHead className="w-[100px]">狀態</TableHead>
            <TableHead>處理人</TableHead>
            <TableHead className="w-[150px]">最後異動</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {!tickets?.length ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                尚無工單
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-mono text-xs">{ticket.larkTicketId}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ticketTypeLabels[ticket.ticketType]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={ticketStatusLabels[ticket.ticketStatus].variant}>
                    {ticketStatusLabels[ticket.ticketStatus].label}
                  </Badge>
                </TableCell>
                <TableCell>{ticket.assigneeName || "-"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString("zh-TW") : "-"}
                </TableCell>
                <TableCell>
                  {ticket.deepLink && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={ticket.deepLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
