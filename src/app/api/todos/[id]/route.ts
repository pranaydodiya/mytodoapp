import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Todo from '@/models/Todo';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const todo = await Todo.findById(params.id);
    if (!todo) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('GET /api/todos/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch todo' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const todo = await Todo.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!todo) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: todo });
  } catch (error) {
    console.error('PUT /api/todos/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const todo = await Todo.findByIdAndDelete(params.id);
    if (!todo) {
      return NextResponse.json(
        { success: false, error: 'Todo not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    console.error('DELETE /api/todos/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
