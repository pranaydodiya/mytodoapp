import { NextRequest, NextResponse } from 'next/server'
import { todos } from '@/lib/store'
import { Priority, Todo } from '@/types/todo'

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high']

// GET /api/todos — return all todos, optional ?priority=&categoryId=&completed= filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const priorityFilter = searchParams.get('priority') as Priority | null
  const categoryIdFilter = searchParams.get('categoryId')
  const completedFilter = searchParams.get('completed')

  let result = [...todos]

  if (priorityFilter && VALID_PRIORITIES.includes(priorityFilter)) {
    result = result.filter(t => t.priority === priorityFilter)
  }
  if (categoryIdFilter !== null) {
    const cid = categoryIdFilter === 'null' ? null : Number(categoryIdFilter)
    result = result.filter(t => t.categoryId === cid)
  }
  if (completedFilter !== null) {
    const done = completedFilter === 'true'
    result = result.filter(t => t.completed === done)
  }

  return NextResponse.json(result, { status: 200 })
}

// POST /api/todos — create a new todo
export async function POST(request: NextRequest) {
  const body = await request.json()
  const text: string = body?.text?.trim()

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const priority: Priority = VALID_PRIORITIES.includes(body.priority)
    ? body.priority
    : 'medium'

  const dueDate: string | null =
    typeof body.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)
      ? body.dueDate
      : null

  const newTodo: Todo = {
    id: Date.now(),
    text,
    completed: false,
    priority,
    categoryId: body.categoryId != null ? Number(body.categoryId) : null,
    dueDate,
    createdAt: new Date().toISOString(),
  }

  todos.push(newTodo)
  return NextResponse.json(newTodo, { status: 201 })
}

// PUT /api/todos — update a todo
export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, text, completed, priority, categoryId, dueDate } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const index = todos.findIndex(t => t.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  todos[index] = {
    ...todos[index],
    ...(text !== undefined && { text: String(text).trim() }),
    ...(completed !== undefined && { completed: Boolean(completed) }),
    ...(priority !== undefined && VALID_PRIORITIES.includes(priority) && { priority }),
    ...(categoryId !== undefined && { categoryId: categoryId === null ? null : Number(categoryId) }),
    ...(dueDate !== undefined && {
      dueDate: dueDate === null ? null
        : /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : todos[index].dueDate,
    }),
  }

  return NextResponse.json(todos[index], { status: 200 })
}

// DELETE /api/todos — delete a todo by id
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
  }

  const index = todos.findIndex(t => t.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  todos.splice(index, 1)
  return NextResponse.json({ message: 'Todo deleted' }, { status: 200 })
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (filter === 'active') query.completed = false;
    if (filter === 'completed') query.completed = true;
    if (priority !== 'all') query.priority = priority;
    if (category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const todos = await Todo.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    console.error('GET /api/todos error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const todo = await Todo.create(body);
    return NextResponse.json({ success: true, data: todo }, { status: 201 });
  } catch (error) {
    console.error('POST /api/todos error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json(
        { success: false, error: 'No IDs provided' },
        { status: 400 }
      );
    }

    const idArray = ids.split(',');
    await Todo.deleteMany({ _id: { $in: idArray } });
    return NextResponse.json({ success: true, message: 'Todos deleted' });
  } catch (error) {
    console.error('DELETE /api/todos error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete todos' },
      { status: 500 }
    );
  }
}
