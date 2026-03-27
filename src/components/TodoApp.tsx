"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Todo,
  CreateTodoInput,
  FilterType,
  Priority,
  Category,
} from "@/types/todo";
import {
  Plus,
  Search,
  Trash2,
  CheckCheck,
  LayoutGrid,
  List,
  Filter,
  Tag,
  Calendar,
  ChevronDown,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  Edit3,
  Save,
  Clock,
  Star,
  Briefcase,
  ShoppingCart,
  Heart,
  DollarSign,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Moon,
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; icon: string }
> = {
  high: {
    label: "High",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    icon: "🔴",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    icon: "🟡",
  },
  low: {
    label: "Low",
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    icon: "🟢",
  },
};

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: React.ReactNode; color: string }
> = {
  personal: { label: "Personal", icon: <Star size={13} />, color: "#a78bfa" },
  work: { label: "Work", icon: <Briefcase size={13} />, color: "#06b6d4" },
  shopping: {
    label: "Shopping",
    icon: <ShoppingCart size={13} />,
    color: "#f59e0b",
  },
  health: { label: "Health", icon: <Heart size={13} />, color: "#ec4899" },
  finance: {
    label: "Finance",
    icon: <DollarSign size={13} />,
    color: "#10b981",
  },
  other: {
    label: "Other",
    icon: <MoreHorizontal size={13} />,
    color: "#9090b0",
  },
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

function formatDueDate(dateStr: string): {
  text: string;
  urgent: boolean;
  overdue: boolean;
} {
  try {
    const date = parseISO(dateStr);
    const overdue = isPast(date) && !isToday(date);
    const urgent = isToday(date) || isTomorrow(date);
    let text = "";
    if (isToday(date)) text = "Due Today";
    else if (isTomorrow(date)) text = "Due Tomorrow";
    else if (overdue) text = `Overdue · ${format(date, "MMM d")}`;
    else text = `Due ${format(date, "MMM d, yyyy")}`;
    return { text, urgent, overdue };
  } catch {
    return { text: "", urgent: false, overdue: false };
  }
}

// ─── AddTodo Modal ─────────────────────────────────────────────────────────────

interface AddTodoModalProps {
  onAdd: (todo: CreateTodoInput) => Promise<void>;
  onClose: () => void;
  editTodo?: Todo | null;
  onEdit: (id: string, data: Partial<Todo>) => Promise<void>;
}

function TodoModal({ onAdd, onClose, editTodo, onEdit }: AddTodoModalProps) {
  const [title, setTitle] = useState(editTodo?.title || "");
  const [description, setDescription] = useState(editTodo?.description || "");
  const [priority, setPriority] = useState<Priority>(
    editTodo?.priority || "medium",
  );
  const [category, setCategory] = useState<Category>(
    editTodo?.category || "personal",
  );
  const [dueDate, setDueDate] = useState(
    editTodo?.dueDate ? editTodo.dueDate.slice(0, 10) : "",
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(editTodo?.tags || []);
  const [loading, setLoading] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (editTodo) {
        await onEdit(editTodo._id, {
          title: title.trim(),
          description,
          priority,
          category,
          dueDate: dueDate || undefined,
          tags,
        });
      } else {
        await onAdd({
          title: title.trim(),
          description,
          priority,
          category,
          dueDate: dueDate || undefined,
          tags,
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-scale-in w-full max-w-lg rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text">
            {editTodo ? "✏️ Edit Task" : "✨ New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          >
            <X size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              required
              className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none transition-all"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent-purple)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--accent-purple)")
              }
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Priority + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-semibold mb-1.5 block"
                style={{ color: "var(--text-secondary)" }}
              >
                Priority
              </label>
              <div className="flex gap-1.5">
                {(["high", "medium", "low"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className="flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background:
                        priority === p
                          ? PRIORITY_CONFIG[p].bg
                          : "var(--bg-input)",
                      border: `1px solid ${priority === p ? PRIORITY_CONFIG[p].color : "var(--border)"}`,
                      color:
                        priority === p
                          ? PRIORITY_CONFIG[p].color
                          : "var(--text-secondary)",
                    }}
                  >
                    {PRIORITY_CONFIG[p].icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className="text-xs font-semibold mb-1.5 block"
                style={{ color: "var(--text-secondary)" }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label
              className="text-xs font-semibold mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Due Date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label
              className="text-xs font-semibold mb-1.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag and press Enter..."
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--accent-purple)", color: "white" }}
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: "rgba(124,58,237,0.2)",
                      color: "var(--accent-purple-light)",
                      border: "1px solid rgba(124,58,237,0.3)",
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:opacity-70"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
              style={{
                background: "var(--bg-input)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background:
                  !title.trim() || loading
                    ? "var(--bg-input)"
                    : "linear-gradient(135deg, #7c3aed, #ec4899)",
                color:
                  !title.trim() || loading ? "var(--text-secondary)" : "white",
                border: "none",
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : editTodo ? (
                <>
                  <Save size={16} /> Save Changes
                </>
              ) : (
                <>
                  <Plus size={16} /> Add Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TodoCard ──────────────────────────────────────────────────────────────────

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  viewMode: "list" | "grid";
  selected: boolean;
  onSelect: (id: string) => void;
}

function TodoCard({
  todo,
  onToggle,
  onDelete,
  onEdit,
  viewMode,
  selected,
  onSelect,
}: TodoCardProps) {
  const priority = PRIORITY_CONFIG[todo.priority];
  const category = CATEGORY_CONFIG[todo.category];
  const dueDateInfo = todo.dueDate ? formatDueDate(todo.dueDate) : null;

  return (
    <div
      className="group animate-fade-in rounded-2xl p-4 transition-all duration-200 cursor-pointer"
      style={{
        background: selected ? "rgba(124,58,237,0.12)" : "var(--bg-card)",
        border: selected
          ? "1px solid rgba(124,58,237,0.5)"
          : `1px solid ${todo.completed ? "var(--border)" : "var(--border)"}`,
        opacity: todo.completed ? 0.65 : 1,
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderColor =
            "var(--border-light)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start gap-3">
        {/* Select checkbox */}
        <div
          className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
          style={{
            borderColor: selected
              ? "var(--accent-purple)"
              : "var(--border-light)",
            background: selected ? "var(--accent-purple)" : "transparent",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(todo._id);
          }}
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Complete checkbox */}
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo._id, !todo.completed)}
          className="custom-checkbox mt-0.5"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className="font-semibold text-sm leading-snug"
              style={{
                color: todo.completed
                  ? "var(--text-secondary)"
                  : "var(--text-primary)",
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.title}
            </p>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(todo);
                }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).closest(
                    "button",
                  )!.style.background = "var(--bg-input)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).closest(
                    "button",
                  )!.style.background = "transparent")
                }
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(todo._id);
                }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--accent-red)" }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).closest(
                    "button",
                  )!.style.background = "rgba(239,68,68,0.1)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).closest(
                    "button",
                  )!.style.background = "transparent")
                }
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {todo.description && (
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {todo.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
            {/* Priority badge */}
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: priority.bg,
                color: priority.color,
                border: `1px solid ${priority.color}30`,
              }}
            >
              {priority.icon} {priority.label}
            </span>

            {/* Category badge */}
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: `${category.color}18`,
                color: category.color,
                border: `1px solid ${category.color}30`,
              }}
            >
              {category.icon} {category.label}
            </span>

            {/* Due date */}
            {dueDateInfo && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: dueDateInfo.overdue
                    ? "rgba(239,68,68,0.15)"
                    : dueDateInfo.urgent
                      ? "rgba(245,158,11,0.15)"
                      : "var(--bg-input)",
                  color: dueDateInfo.overdue
                    ? "#ef4444"
                    : dueDateInfo.urgent
                      ? "#f59e0b"
                      : "var(--text-secondary)",
                  border: `1px solid ${dueDateInfo.overdue ? "rgba(239,68,68,0.3)" : dueDateInfo.urgent ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
                }}
              >
                <Clock size={10} /> {dueDateInfo.text}
              </span>
            )}

            {/* Tags */}
            {todo.tags.slice(0, viewMode === "grid" ? 2 : 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  color: "var(--accent-purple-light)",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                #{tag}
              </span>
            ))}
            {todo.tags.length > (viewMode === "grid" ? 2 : 3) && (
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                +{todo.tags.length - (viewMode === "grid" ? 2 : 3)}
              </span>
            )}
          </div>

          {/* Created at */}
          <p className="text-xs mt-1.5" style={{ color: "#50506080" }}>
            {format(parseISO(todo.createdAt), "MMM d, h:mm a")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── StatsBar ──────────────────────────────────────────────────────────────────

interface StatsBarProps {
  todos: Todo[];
}

function StatsBar({ todos }: StatsBarProps) {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const active = total - completed;
  const high = todos.filter(
    (t) => t.priority === "high" && !t.completed,
  ).length;
  const overdue = todos.filter(
    (t) =>
      t.dueDate &&
      isPast(parseISO(t.dueDate)) &&
      !isToday(parseISO(t.dueDate)) &&
      !t.completed,
  ).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: "Total",
      value: total,
      color: "#9090b0",
      bg: "rgba(144,144,176,0.1)",
    },
    {
      label: "Active",
      value: active,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.1)",
    },
    {
      label: "Done",
      value: completed,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
    },
    {
      label: "Urgent",
      value: high,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
    },
    {
      label: "Overdue",
      value: overdue,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: s.bg, border: `1px solid ${s.color}25` }}
          >
            <span className="text-xl font-bold" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="text-xs font-medium" style={{ color: s.color }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div
            className="flex justify-between text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>Progress</span>
            <span className="font-bold" style={{ color: "#10b981" }}>
              {progress}% complete
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--bg-input)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #7c3aed, #10b981)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main TodoApp ──────────────────────────────────────────────────────────────

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // ─── Fetch Todos ─────────────────────────────────────────────────────────────

  const fetchTodos = useCallback(
    async (q?: {
      filter?: string;
      priority?: string;
      category?: string;
      search?: string;
    }) => {
      try {
        const params = new URLSearchParams();
        params.set("filter", q?.filter || filter);
        params.set(
          "priority",
          q?.priority !== undefined ? q.priority : priorityFilter,
        );
        params.set(
          "category",
          q?.category !== undefined ? q.category : categoryFilter,
        );
        if (q?.search !== undefined ? q.search : search) {
          params.set("search", q?.search !== undefined ? q.search : search);
        }
        const res = await fetch(`/api/todos?${params}`);
        const data = await res.json();
        if (data.success) {
          setTodos(data.data);
          setError(null);
        } else {
          setError("Failed to load tasks");
        }
      } catch {
        setError("Connection error. Please check your network.");
      } finally {
        setLoading(false);
      }
    },
    [filter, priorityFilter, categoryFilter, search],
  );

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // ─── Search debounce ──────────────────────────────────────────────────────────

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchTodos({ search: value });
    }, 400);
  };

  // ─── Filter handlers ──────────────────────────────────────────────────────────

  const handleFilter = (f: FilterType) => {
    setFilter(f);
    fetchTodos({ filter: f });
  };

  const handlePriorityFilter = (p: string) => {
    setPriorityFilter(p);
    fetchTodos({ priority: p });
  };

  const handleCategoryFilter = (c: string) => {
    setCategoryFilter(c);
    fetchTodos({ category: c });
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  const addTodo = async (input: CreateTodoInput) => {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (data.success) {
      setTodos((prev) => [data.data, ...prev]);
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.success) {
      setTodos((prev) => prev.map((t) => (t._id === id ? data.data : t)));
    }
  };

  const toggleTodo = (id: string, completed: boolean) =>
    updateTodo(id, { completed });

  const deleteTodo = async (id: string) => {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setTodos((prev) => prev.filter((t) => t._id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(",");
    const res = await fetch(`/api/todos?ids=${ids}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setTodos((prev) => prev.filter((t) => !selectedIds.has(t._id)));
      setSelectedIds(new Set());
    }
  };

  const markAllComplete = async () => {
    await Promise.all(
      todos
        .filter((t) => !t.completed)
        .map((t) => updateTodo(t._id, { completed: true })),
    );
  };

  // ─── Selection ───────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Sorting ─────────────────────────────────────────────────────────────────

  const sortedTodos = [...todos].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Background gradient orbs */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            top: -200,
            left: -200,
            background:
              "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: -150,
            right: -100,
            background:
              "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              }}
            >
              <Sparkles size={20} color="white" />
            </div>
            <h1 className="text-3xl font-extrabold gradient-text">TaskFlow</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage your tasks with clarity and focus
          </p>
        </header>

        {/* Stats */}
        <StatsBar todos={todos} />

        {/* Toolbar */}
        <div className="mb-4 space-y-3">
          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <Search
                size={16}
                style={{ color: "var(--text-secondary)", flexShrink: 0 }}
              />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search tasks, tags..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }}
              />
              {search && (
                <button onClick={() => handleSearch("")}>
                  <X size={14} style={{ color: "var(--text-secondary)" }} />
                </button>
              )}
            </div>

            {/* View mode */}
            <button
              onClick={() =>
                setViewMode((v) => (v === "list" ? "grid" : "list"))
              }
              className="p-2.5 rounded-xl transition-colors"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
              title={viewMode === "list" ? "Grid view" : "List view"}
            >
              {viewMode === "list" ? (
                <LayoutGrid size={17} />
              ) : (
                <List size={17} />
              )}
            </button>

            {/* Sort */}
            <button
              onClick={() =>
                setSortOrder((s) => (s === "desc" ? "asc" : "desc"))
              }
              className="p-2.5 rounded-xl transition-colors"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
              title="Toggle sort order"
            >
              {sortOrder === "desc" ? (
                <SortDesc size={17} />
              ) : (
                <SortAsc size={17} />
              )}
            </button>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="p-2.5 rounded-xl transition-colors"
              style={{
                background: showFilters
                  ? "rgba(124,58,237,0.2)"
                  : "var(--bg-card)",
                border: `1px solid ${showFilters ? "rgba(124,58,237,0.5)" : "var(--border)"}`,
                color: showFilters
                  ? "var(--accent-purple-light)"
                  : "var(--text-secondary)",
              }}
              title="Filters"
            >
              <Filter size={17} />
            </button>

            {/* Add Task */}
            <button
              onClick={() => {
                setEditTodo(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                color: "white",
                boxShadow: "0 4px 15px rgba(124,58,237,0.35)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              <Plus size={17} /> Add Task
            </button>
          </div>

          {/* Filters Row */}
          {showFilters && (
            <div
              className="animate-fade-in flex flex-wrap gap-2 p-4 rounded-xl"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Status filter */}
              <div className="flex gap-1">
                {(["all", "active", "completed"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{
                      background:
                        filter === f
                          ? "var(--accent-purple)"
                          : "var(--bg-input)",
                      color: filter === f ? "white" : "var(--text-secondary)",
                      border: `1px solid ${filter === f ? "transparent" : "var(--border)"}`,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="w-px" style={{ background: "var(--border)" }} />

              {/* Priority filter */}
              <div className="flex gap-1">
                {[
                  { v: "all", l: "All Priority" },
                  { v: "high", l: "🔴 High" },
                  { v: "medium", l: "🟡 Med" },
                  { v: "low", l: "🟢 Low" },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => handlePriorityFilter(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background:
                        priorityFilter === v
                          ? "rgba(124,58,237,0.2)"
                          : "var(--bg-input)",
                      color:
                        priorityFilter === v
                          ? "var(--accent-purple-light)"
                          : "var(--text-secondary)",
                      border: `1px solid ${priorityFilter === v ? "rgba(124,58,237,0.4)" : "var(--border)"}`,
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="w-px" style={{ background: "var(--border)" }} />

              {/* Category filter */}
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div
              className="animate-fade-in flex items-center justify-between px-4 py-3 rounded-xl"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.3)",
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: "var(--accent-purple-light)" }}
              >
                {selectedIds.size} task{selectedIds.size > 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: "var(--bg-input)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Deselect
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: "rgba(239,68,68,0.2)",
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                >
                  <Trash2 size={12} /> Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Quick actions row */}
          {todos.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={markAllComplete}
                disabled={todos.every((t) => t.completed)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <CheckCheck size={13} /> Mark all done
              </button>
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {sortedTodos.length} task{sortedTodos.length !== 1 ? "s" : ""}{" "}
                shown
              </span>
            </div>
          )}
        </div>

        {/* Todo List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="skeleton h-24 rounded-2xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <AlertCircle
              size={40}
              style={{ color: "#ef4444", margin: "0 auto 12px" }}
            />
            <p className="font-semibold" style={{ color: "#ef4444" }}>
              {error}
            </p>
            <button
              onClick={() => fetchTodos()}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(124,58,237,0.2)",
                color: "var(--accent-purple-light)",
              }}
            >
              Try again
            </button>
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <Moon size={36} style={{ color: "var(--accent-purple-light)" }} />
            </div>
            <p
              className="text-lg font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {search
                ? "No tasks found"
                : filter === "completed"
                  ? "No completed tasks"
                  : filter === "active"
                    ? "All caught up!"
                    : "No tasks yet"}
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              {search
                ? `No results for "${search}"`
                : "Add your first task to get started"}
            </p>
            {!search && (
              <button
                onClick={() => {
                  setEditTodo(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                  color: "white",
                }}
              >
                <Plus size={17} /> Create your first task
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                : "space-y-3"
            }
          >
            {sortedTodos.map((todo) => (
              <TodoCard
                key={todo._id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={(t) => {
                  setEditTodo(t);
                  setShowModal(true);
                }}
                viewMode={viewMode}
                selected={selectedIds.has(todo._id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer
          className="mt-12 text-center text-xs"
          style={{ color: "#40405060" }}
        >
          <p>TaskFlow — Built with Next.js &amp; MongoDB</p>
        </footer>
      </div>

      {/* Modal */}
      {showModal && (
        <TodoModal
          onAdd={addTodo}
          onClose={() => {
            setShowModal(false);
            setEditTodo(null);
          }}
          editTodo={editTodo}
          onEdit={updateTodo}
        />
      )}
    </div>
  );
}
