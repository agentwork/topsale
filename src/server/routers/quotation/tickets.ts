import { z } from "zod";

import { ticketCreateSchema, ticketSyncSchema } from "@/app/(main)/dashboard/quotation/schema";

import { publicProcedure, router } from "../../trpc";

interface Ticket {
  id: string;
  quotationId: string;
  larkTicketId: string | null;
  ticketType: string;
  ticketStatus: string;
  assigneeName: string | null;
  deepLink: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ticketsRouter = router({
  getByQuotation: publicProcedure
    .input(z.object({ quotationId: z.string().uuid() }))
    .query(async (): Promise<Ticket[]> => {
      return [];
    }),

  create: publicProcedure.input(ticketCreateSchema).mutation(async ({ input }): Promise<Ticket> => {
    return {
      id: crypto.randomUUID(),
      quotationId: input.quotationId,
      larkTicketId: `LARK-${Date.now()}`,
      ticketType: input.ticketType,
      ticketStatus: "pending",
      assigneeName: null,
      deepLink: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  syncStatus: publicProcedure.input(ticketSyncSchema).mutation(async ({ input }) => {
    return {
      success: true,
      larkTicketId: input.larkTicketId,
      ticketStatus: input.ticketStatus,
    };
  }),
});
