"use client";

import { useState } from "react";

import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  onComplete: () => void;
}

export function ApprovalDialog({ open, onOpenChange, quotationId, onComplete }: ApprovalDialogProps) {
  const [remark, setRemark] = useState("");

  const submitMutation = trpc.quotation.quotations.submitForApproval.useMutation({
    onSuccess: () => {
      toast.success("已送出審核");
      setRemark("");
      onOpenChange(false);
      onComplete();
    },
    onError: (error) => {
      toast.error(`送出失敗：${error.message}`);
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate({
      id: quotationId,
      remark,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>送出審核</DialogTitle>
          <DialogDescription>此報價單將推送到 Lark 審批流程</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="font-medium text-sm">審核流程</p>
            <p className="text-muted-foreground text-xs">業務主管 → 財務 → 總經理</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="approval-remark" className="font-medium text-sm">
              備註
            </label>
            <textarea
              id="approval-remark"
              className="w-full rounded-md border bg-background p-2 text-sm"
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="請輸入審核備註（選填）"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
            {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            送出審核
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
