import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, GripVertical, X, CheckSquare } from 'lucide-react';

type Status = 'todo' | 'doing' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  createdAt: number;
}

const COLUMNS: { id: Status; title: string; color: string; bgColor: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { id: 'doing', title: 'Doing', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kanban-tasks');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse tasks from local storage');
      }
    } else {
      // Add some default tasks
      setTasks([
        { id: '1', title: 'Research competitors', description: 'Analyze top 3 competitors in the market.', status: 'todo', createdAt: Date.now() },
        { id: '2', title: 'Design landing page', description: 'Create wireframes and high-fidelity mockups.', status: 'doing', createdAt: Date.now() - 1000 },
        { id: '3', title: 'Setup project repo', description: 'Initialize Git, configure ESLint and Prettier.', status: 'done', createdAt: Date.now() - 2000 },
      ]);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (title: string, description: string, status: Status = 'todo') => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      status,
      createdAt: Date.now(),
    };
    setTasks([...tasks, newTask]);
    setIsModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(id);
    
    // Use a small timeout to allow the drag image to be captured before hiding the original
    setTimeout(() => {
      const el = document.getElementById(`task-${id}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
    setDragOverTaskId(null);
    const el = document.getElementById(`task-${id}`);
    if (el) el.classList.remove('opacity-50');
  };

  const handleDragOverColumn = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragOverTask = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent column drag over from firing
    if (dragOverTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
    // Also set the column so it highlights
    const task = tasks.find(t => t.id === taskId);
    if (task && dragOverColumn !== task.status) {
      setDragOverColumn(task.status);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    setDragOverColumn(null);
  };

  const handleDragLeaveTask = (e: React.DragEvent) => {
    setDragOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, status: Status, targetTaskId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverColumn(null);
    setDragOverTaskId(null);
    
    const draggedId = e.dataTransfer.getData('taskId');
    if (!draggedId) return;

    setTasks((prev) => {
      const draggedTask = prev.find((t) => t.id === draggedId);
      if (!draggedTask) return prev;

      // Remove the dragged task from its current position
      const newTasks = prev.filter((t) => t.id !== draggedId);
      
      // Update its status
      const updatedTask = { ...draggedTask, status };

      // If dropped on a specific task, insert it before that task
      if (targetTaskId && targetTaskId !== draggedId) {
        const targetIndex = newTasks.findIndex((t) => t.id === targetTaskId);
        if (targetIndex !== -1) {
          newTasks.splice(targetIndex, 0, updatedTask);
          return newTasks;
        }
      }

      // Otherwise, just append it to the end of the column
      newTasks.push(updatedTask);
      return newTasks;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 z-10 shadow-sm gap-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          {/* Logo container */}
          <div className="flex items-center gap-3">
            {/* Replace this src with your actual uploaded logo URL or path (e.g., '/logo.png') */}
            <img 
              src="https://placehold.co/400x120/ffffff/4f46e5?text=Kanban+App&font=Montserrat" 
              alt="Kanban App Logo" 
              className="h-10 md:h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Mobile add button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="sm:hidden bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg font-medium transition-colors flex items-center justify-center shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <div className="text-sm text-slate-500 font-medium">
            &copy; 2026 Designed &amp; Developed by <span className="text-indigo-600 font-bold tracking-wide">Ubaidullah</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors items-center gap-2 shadow-sm"
          >
            <Plus size={20} />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {/* Board Area */}
      <main className="flex-1 overflow-x-hidden md:overflow-x-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 h-full min-h-[calc(100vh-120px)] items-stretch md:items-start">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            const isOverCol = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-full md:w-80 rounded-xl flex flex-col bg-slate-200/50 border-2 transition-colors duration-200 ${
                  isOverCol ? 'border-indigo-400 bg-indigo-50/50' : 'border-transparent'
                }`}
                onDragOver={(e) => handleDragOverColumn(e, col.id)}
                onDragLeave={handleDragLeaveColumn}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${col.color}`} />
                    <h2 className="font-semibold text-slate-700">{col.title}</h2>
                  </div>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[150px]">
                  {columnTasks.map((task) => {
                    const isOverTask = dragOverTaskId === task.id;
                    const isDragged = draggedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        id={`task-${task.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={(e) => handleDragEnd(e, task.id)}
                        onDragOver={(e) => handleDragOverTask(e, task.id)}
                        onDragLeave={handleDragLeaveTask}
                        onDrop={(e) => handleDrop(e, col.id, task.id)}
                        className={`group relative bg-white p-4 rounded-xl shadow-sm border transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md ${
                          isOverTask ? 'border-indigo-500 translate-y-1' : 'border-slate-200'
                        } ${isDragged ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}
                      >
                        {/* Drop indicator line (shows when dragging over a task) */}
                        {isOverTask && (
                          <div className="absolute -top-2 left-0 right-0 h-1 bg-indigo-500 rounded-full" />
                        )}

                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-slate-800 leading-tight">{task.title}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50"
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Drag handle hint */}
                        <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2">
                          <GripVertical size={16} className="text-slate-300" />
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty state placeholder */}
                  {columnTasks.length === 0 && !isOverCol && (
                    <div className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Add New Task</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const desc = formData.get('description') as string;
                const status = formData.get('status') as Status;
                if (title.trim()) {
                  handleAddTask(title.trim(), desc.trim(), status);
                }
              }}
              className="p-6 flex flex-col gap-5"
            >
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  autoFocus
                  placeholder="e.g., Update user dashboard"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Add more details about this task..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                >
                  <option value="todo">To Do</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
