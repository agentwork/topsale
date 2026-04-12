'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export function TodosTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);

  const { data, isLoading, refetch } = trpc.todos.list.useQuery({
    page,
    pageSize: 10,
    search: search || undefined,
    completed: showCompleted ? undefined : false,
    priority: (priority as 'low' | 'medium' | 'high') || undefined,
  });

  const createMutation = trpc.todos.create.useMutation({
    onSuccess: () => refetch(),
  });

  const toggleMutation = trpc.todos.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.todos.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle,
      description: newDescription || undefined,
      priority: newPriority,
      dueDate: newDueDate,
    });
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate(undefined);
    setShowCreateForm(false);
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4">
        {!showCreateForm ? (
          <Button variant="outline" onClick={() => setShowCreateForm(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add New Todo
          </Button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Input
                placeholder="New todo title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1"
              />
              <Select value={newPriority} onValueChange={(v) => setNewPriority(v as typeof newPriority)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {newDueDate ? format(newDueDate, 'MMM d, yyyy') : 'Due Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDueDate}
                    onSelect={setNewDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              placeholder="Description (optional)..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !newTitle.trim()}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search todos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowCompleted(!showCompleted)}>
            {showCompleted ? 'Hide Completed' : 'Show All'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Done</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((todo) => (
                <TableRow key={todo.id}>
                  <TableCell>
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleMutation.mutate({ id: todo.id, completed: !todo.completed })}
                    />
                  </TableCell>
                  <TableCell className={todo.completed ? 'line-through text-muted-foreground' : ''}>
                    {todo.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {todo.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[todo.priority || 'medium']}>
                      {todo.priority || 'medium'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {todo.dueDate ? format(new Date(todo.dueDate), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell>{format(new Date(todo.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate({ id: todo.id })}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No todos found. Create one above!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {data && data.pageCount > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {page} of {data.pageCount}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(data.pageCount, p + 1))}
              disabled={page === data.pageCount}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
