"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowLeft, FileText, Pencil, Stamp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

import { ApprovalDialog } from "../_components/approval/approval-dialog";
import { PdfExportButton } from "../_components/export/pdf-export-button";
import { InvoiceTracking } from "../_components/financial/invoice-tracking";
import { RevisionLog } from "../_components/financial/revision-log";
import { ProjectEditorDialog } from "../_components/project-editor/project-editor-dialog";
import { TicketTracker } from "../_components/tickets/ticket-tracker";
import { QuotationHeader } from "../_components/view/quotation-header";
import { QuotationSummary } from "../_components/view/quotation-summary";
import { TargetingSection } from "../_components/view/targeting-section";

const _statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  pending_approval: { label: "待審核", variant: "outline" },
  approved: { label: "已核准", variant: "default" },
  confirmed: { label: "已確認", variant: "default" },
  closed: { label: "已結案", variant: "secondary" },
  withdrawn: { label: "已撤回", variant: "destructive" },
};

export default function QuotationViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [projectEditorOpen, setProjectEditorOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: quotation, isLoading } = trpc.quotation.quotations.getById.useQuery({
    id: params.id,
  });

  const { data: lineItems } = trpc.quotation.lineItems.getByQuotation.useQuery({
    quotationId: params.id,
  });

  const { data: targeting } = trpc.quotation.targeting.getByQuotation.useQuery({
    quotationId: params.id,
  });

  const utils = trpc.useUtils();

  const handleRefresh = () => {
    utils.quotation.quotations.getById.invalidate({ id: params.id });
    utils.quotation.lineItems.getByQuotation.invalidate({ quotationId: params.id });
    utils.quotation.targeting.getByQuotation.invalidate({ quotationId: params.id });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium text-lg">找不到報價單</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/quotation")}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/quotation")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-2xl">報價單詳情</h1>
            <p className="text-muted-foreground">Quotation Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {quotation.status === "draft" && (
            <>
              <Button variant="outline" onClick={() => setProjectEditorOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                編輯專案
              </Button>
              <Button variant="default" onClick={() => setApprovalOpen(true)}>
                送出審核
              </Button>
            </>
          )}
          {quotation.status === "confirmed" && <PdfExportButton quotationId={params.id} />}
        </div>
      </div>

      <QuotationHeader quotation={quotation} />

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">報價明細</TabsTrigger>
          <TabsTrigger value="targeting">投放條件</TabsTrigger>
          <TabsTrigger value="financial">財務管理</TabsTrigger>
          <TabsTrigger value="tickets">工單追蹤</TabsTrigger>
          <TabsTrigger value="terms">條款與用印</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <div className="border-b px-6 py-4">
              <h2 className="font-semibold text-lg">報價明細</h2>
            </div>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>產品名稱</TableHead>
                    <TableHead className="w-[120px]">走期起</TableHead>
                    <TableHead className="w-[120px]">走期訖</TableHead>
                    <TableHead className="w-[80px]">天數</TableHead>
                    <TableHead className="w-[120px] text-right">單價</TableHead>
                    <TableHead className="w-[120px] text-right">預算</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!lineItems?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        尚無明細
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.displayName}</TableCell>
                        <TableCell className="text-xs">{item.startDate}</TableCell>
                        <TableCell className="text-xs">{item.endDate}</TableCell>
                        <TableCell>{item.days}</TableCell>
                        <TableCell className="text-right font-mono">${item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">${item.budget.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <QuotationSummary quotation={quotation} />
        </TabsContent>

        <TabsContent value="targeting">
          <TargetingSection targeting={targeting} quotationId={params.id} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <InvoiceTracking quotationId={params.id} totalGross={quotation.totalGross ?? 0} />
          <RevisionLog quotationId={params.id} />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketTracker quotationId={params.id} />
        </TabsContent>

        <TabsContent value="terms" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h3 className="font-semibold text-lg">合約條款</h3>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">甲方（客戶）資訊</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">公司名稱</Label>
                    <Input placeholder="請輸入公司名稱" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">統一編號</Label>
                    <Input placeholder="請輸入統一編號" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">公司地址</Label>
                    <Input placeholder="請輸入公司地址" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">聯絡人</Label>
                    <Input placeholder="請輸入聯絡人姓名" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">聯絡電話</Label>
                    <Input placeholder="請輸入聯絡電話" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">乙方（媒體）資訊</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">公司名稱</Label>
                    <Input defaultValue="VMFIVE" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">統一編號</Label>
                    <Input placeholder="請輸入統一編號" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">公司地址</Label>
                    <Input placeholder="請輸入公司地址" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">特殊條款</Label>
                <Textarea placeholder="請輸入特殊條款或備註" rows={4} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms-accept"
                    checked={termsAccepted}
                    onCheckedChange={(c) => setTermsAccepted(c === true)}
                  />
                  <Label htmlFor="terms-accept" className="text-sm">
                    我已確認所有條款內容無誤
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-6 flex items-center gap-2">
              <Stamp className="h-5 w-5" />
              <h3 className="font-semibold text-lg">用印區塊</h3>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-lg border border-dashed p-6">
                <h4 className="mb-4 text-center font-medium">甲方用印</h4>
                <div className="flex flex-col items-center justify-center">
                  <div className="h-32 w-32 rounded-full border-2 border-muted-foreground/30 border-dashed" />
                  <p className="mt-4 text-muted-foreground text-sm">請蓋上公司印章</p>
                  <p className="mt-1 text-muted-foreground text-xs">日期：____年____月____日</p>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-6">
                <h4 className="mb-4 text-center font-medium">乙方用印</h4>
                <div className="flex flex-col items-center justify-center">
                  <div className="h-32 w-32 rounded-full border-2 border-muted-foreground/30 border-dashed" />
                  <p className="mt-4 text-muted-foreground text-sm">請蓋上公司印章</p>
                  <p className="mt-1 text-muted-foreground text-xs">日期：____年____月____日</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ProjectEditorDialog
        open={projectEditorOpen}
        onOpenChange={setProjectEditorOpen}
        quotationId={params.id}
        onComplete={handleRefresh}
      />

      <ApprovalDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        quotationId={params.id}
        onComplete={handleRefresh}
      />
    </div>
  );
}
