export type Priority = 'low' | 'medium' | 'high';
export type Category = 'personal' | 'work' | 'shopping' | 'health' | 'finance' | 'other';
export type FilterType = 'all' | 'active' | 'completed';

export interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority: Priority;
  category: Category;
  dueDate?: string;
  tags: string[];
}
