
export interface Todo {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed';
    created_at: string;
    updated_at: string;
    user_id: string;
  }
  
  export interface CreateTodoInput {
    title: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed';
  }
  
  export interface UpdateTodoInput {
    title?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed';
  }
