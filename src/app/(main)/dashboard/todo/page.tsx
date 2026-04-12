import { TodosTable } from './_components/todos-table';

export default function TodoPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Todo List</h1>
        <p className="text-muted-foreground">Manage your tasks with Drizzle + tRPC + Supabase</p>
      </div>
      <TodosTable />
    </div>
  );
}
