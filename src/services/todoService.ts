// services/todoService.ts
import { supabase } from '@/lib/supabase'
import type { Todo, CreateTodoInput, UpdateTodoInput } from '@/types/todo'

export class TodoService {
  static async getAllTodos(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching todos:', error)
      throw new Error('Failed to fetch todos')
    }

    return data || []
  }

  static async createTodo(input: CreateTodoInput): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('todos')
      .insert({
        ...input,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating todo:', error)
      throw new Error('Failed to create todo')
    }

    return data
  }

  static async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating todo:', error)
      throw new Error('Failed to update todo')
    }

    return data
  }

  static async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error)
      throw new Error('Failed to delete todo')
    }
  }
}