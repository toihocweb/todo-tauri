
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckSquare, Settings, User, Lock, LogOut, Loader2, Plus, ListTodo, Clock, CheckCircle, TrendingUp, Target, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TodoService } from "@/lib/todoService";
import { TodoCard } from "@/components/TodoCard";
import { AddTodoDialog } from "@/components/AddTodoDialog";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Todo, CreateTodoInput, UpdateTodoInput } from "@/types/todo";
import "./app.css";

function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Todo states
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          toast.info("Signed out", {
            description: "You have been signed out successfully",
          });
          setTodos([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load todos when user changes
  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user]);

  const loadTodos = async () => {
    setTodosLoading(true);
    try {
      const todosData = await TodoService.getAllTodos();
      setTodos(todosData);
    } catch (error: any) {
      toast.error("Failed to load todos", {
        description: error.message,
      });
    } finally {
      setTodosLoading(false);
    }
  };

  const handleAddTodo = async (input: CreateTodoInput) => {
    try {
      const newTodo = await TodoService.createTodo(input);
      setTodos([newTodo, ...todos]);
      toast.success("Todo added successfully!");
    } catch (error: any) {
      toast.error("Failed to add todo", {
        description: error.message,
      });
      throw error;
    }
  };

  const handleUpdateTodo = async (id: string, input: UpdateTodoInput) => {
    try {
      const updatedTodo = await TodoService.updateTodo(id, input);
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
      toast.success("Todo updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update todo", {
        description: error.message,
      });
      throw error;
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await TodoService.deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
      toast.success("Todo deleted successfully!");
    } catch (error: any) {
      toast.error("Failed to delete todo", {
        description: error.message,
      });
      throw error;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        setLoginError(error.message);
        toast.error("Login Failed", {
          description: error.message,
        });
      } else {
        setLoginData({ email: "", password: "" });
      }
    } catch (error) {
      const errorMsg = "An unexpected error occurred";
      setLoginError(errorMsg);
      toast.error("Login Error", {
        description: errorMsg,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoginError("");
    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        setLoginError(error.message);
        toast.error("Sign Up Failed", {
          description: error.message,
        });
      } else {
        toast.success("Check Your Email", {
          description: "We sent you a confirmation link to complete your registration",
        });
      }
    } catch (error) {
      const errorMsg = "An unexpected error occurred";
      setLoginError(errorMsg);
      toast.error("Sign Up Error", {
        description: errorMsg,
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Filter todos based on active tab
  const getFilteredTodos = () => {
    switch (activeTab) {
      case 'pending':
        return todos.filter(todo => todo.status === 'pending');
      case 'in_progress':
        return todos.filter(todo => todo.status === 'in_progress');
      case 'completed':
        return todos.filter(todo => todo.status === 'completed');
      default:
        return todos;
    }
  };

  const getStatusCounts = () => {
    return {
      all: todos.length,
      pending: todos.filter(t => t.status === 'pending').length,
      in_progress: todos.filter(t => t.status === 'in_progress').length,
      completed: todos.filter(t => t.status === 'completed').length,
    };
  };

  const getCompletionPercentage = () => {
    if (todos.length === 0) return 0;
    return Math.round((getStatusCounts().completed / todos.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold">Login</h1>
            </div>
            <CardTitle>Welcome to Todo App</CardTitle>
            <CardDescription>
              Please sign in to manage your todos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-500">{loginError}</p>
              )}
              <div className="space-y-2">
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleSignUp}
                  disabled={loginLoading}
                >
                  Sign Up
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const filteredTodos = getFilteredTodos();
  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Todo App
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Organize your tasks efficiently
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Fancy Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tasks Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
                  <p className="text-3xl font-bold mt-1">{statusCounts.all}</p>
                  <p className="text-blue-100 text-xs mt-1">All your todos</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <ListTodo className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pending Tasks Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold mt-1">{statusCounts.pending}</p>
                  <p className="text-amber-100 text-xs mt-1">Waiting to start</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Clock className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* In Progress Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">In Progress</p>
                  <p className="text-3xl font-bold mt-1">{statusCounts.in_progress}</p>
                  <p className="text-indigo-100 text-xs mt-1">Currently working</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Zap className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Completed Card with Progress */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-white/5 rounded-full"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-emerald-100 text-sm font-medium">Completed</p>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <p className="text-3xl font-bold">{statusCounts.completed}</p>
                    <p className="text-emerald-200 text-lg font-semibold">{completionPercentage}%</p>
                  </div>
                  <div className="mt-2 bg-white/20 rounded-full h-1.5">
                    <div 
                      className="bg-white rounded-full h-1.5 transition-all duration-500 ease-out"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-lg ml-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Todos Section with Animated Border */}
        <div className="relative">
          {/* Animated Border */}
          <div className="absolute inset-0 rounded-xl">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 via-red-500 via-orange-500 via-yellow-500 via-green-500 via-cyan-500 to-blue-500 bg-[length:800%_800%] animate-gradient-border p-[2px]">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-xl"></div>
            </div>
          </div>
          
          {/* Content */}
          <Card className="relative z-10 bg-transparent border-0 shadow-none">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Todos</CardTitle>
                  <CardDescription>
                    Manage your tasks and track progress
                  </CardDescription>
                </div>
                <AddTodoDialog onAdd={handleAddTodo} />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="flex items-center space-x-2">
                    <ListTodo className="w-4 h-4" />
                    <span>All ({statusCounts.all})</span>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Pending ({statusCounts.pending})</span>
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>In Progress ({statusCounts.in_progress})</span>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed ({statusCounts.completed})</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  {todosLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : filteredTodos.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ListTodo className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {activeTab === 'all' ? 'No todos yet' : `No ${activeTab.replace('_', ' ')} todos`}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {activeTab === 'all' 
                          ? 'Create your first todo to get started organizing your tasks!' 
                          : `No tasks are currently ${activeTab.replace('_', ' ')}.`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTodos.map((todo) => (
                        <TodoCard
                          key={todo.id}
                          todo={todo}
                          onUpdate={handleUpdateTodo}
                          onDelete={handleDeleteTodo}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <style>{`
        @keyframes gradient-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient-border {
          animation: gradient-border 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
