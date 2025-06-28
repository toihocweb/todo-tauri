import { supabase } from './supabase';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo';

export class TodoService {
  static async getAllTodos(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createTodo(input: CreateTodoInput): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('todos')
      .insert({
        ...input,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getTodosByStatus(status: Todo['status']): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}