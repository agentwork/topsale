"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";

interface RevisionLogProps {
  quotationId: string;
}

const changeTypeLabels: Record<string, { label: string; variant: "default" | "destructive" }> = {
  "top-up": { label: "加碼", variant: "default" },
  reduction: { label: "抽單", variant: "destructive" },
};

export function RevisionLog({ quotationId }: RevisionLogProps) {
  const { data: revisions } = trpc.quotation.revisions.getByQuotation.useQuery({
    quotationId,
  });

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-4 font-semibold">修正紀錄</h3>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">版本</TableHead>
            <TableHead className="w-[100px]">類型</TableHead>
            <TableHead className="text-right">原金額</TableHead>
            <TableHead className="text-right">新金額</TableHead>
            <TableHead className="text-right">差額</TableHead>
            <TableHead className="w-[150px]">建立時間</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!revisions?.length ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                尚無修正紀錄
              </TableCell>
            </TableRow>
          ) : (
            revisions.map((revision) => {
              const diff = revision.newAmount - revision.oldAmount;
              return (
                <TableRow key={revision.id}>
                  <TableCell className="font-mono">v{revision.revisionNo}</TableCell>
                  <TableCell>
                    <Badge variant={changeTypeLabels[revision.changeType].variant}>
                      {changeTypeLabels[revision.changeType].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">${revision.oldAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${revision.newAmount.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono ${diff >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {diff >= 0 ? "+" : ""}
                    {diff.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {revision.createdAt ? new Date(revision.createdAt).toLocaleString("zh-TW") : "-"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
