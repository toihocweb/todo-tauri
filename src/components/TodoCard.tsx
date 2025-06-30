// components/TodoCard.tsx
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreVertical,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  Play,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Settings,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Todo, UpdateTodoInput } from "@/types/todo";

interface TodoCardProps {
  todo: Todo;
  onUpdate: (id: string, input: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const getStatusColor = (status: Todo["status"]): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusLabel = (status: Todo["status"]): string => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
};

const statusIcons = {
  pending: Clock,
  in_progress: Target,
  completed: CheckCircle,
};

const TIME = 45;
export function TodoCard({ todo, onUpdate, onDelete }: TodoCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editData, setEditData] = useState({
    title: todo.title,
    description: todo.description || "",
    status: todo.status,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await onUpdate(todo.id, editData);
      setIsEditOpen(false);
      toast.success("Todo Updated!", {
        description: `"${editData.title}" has been updated successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to update todo:", error);
      toast.error("Failed to update todo", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(todo.id);
      setIsDeleteOpen(false);
      toast.success("Todo Deleted!", {
        description: `"${todo.title}" has been deleted successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to delete todo:", error);
      toast.error("Failed to delete todo", {
        description: "Please try again later.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStartTimer = async () => {
    try {
      await invoke("start_timer", {
        todoTitle: todo.title,
        todoId: todo.id,
        durationMinutes: TIME,
      });

      toast.success("Timer Started!", {
        description: `${TIME}-minute focus session for: ${todo.title}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to start timer:", error);
      toast.error("Failed to start timer");
    }
  };

  const handleEditOpen = () => {
    setEditData({
      title: todo.title,
      description: todo.description || "",
      status: todo.status,
    });
    setIsEditOpen(true);
  };

  const StatusIcon = statusIcons[editData.status];

  return (
    <Card
      className="w-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] relative group border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Action Buttons */}
      <div
        className={`absolute top-3 right-3 flex space-x-2 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        {/* Edit Button */}
        <Button
          onClick={handleEditOpen}
          size="sm"
          className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Edit todo"
        >
          <Edit3 className="w-4 h-4" />
        </Button>

        {/* Delete Button */}
        <Button
          onClick={() => setIsDeleteOpen(true)}
          size="sm"
          className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Delete todo"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Start Timer Button - Bottom Right */}
      {isHovered && todo.status !== "completed" && (
        <Button
          onClick={handleStartTimer}
          className="absolute bottom-3 right-3 h-10 w-10 p-0 bg-green-500 hover:bg-green-600 text-white shadow-lg rounded-full"
          title="Start 25-minute focus timer"
        >
          <Play className="w-5 h-5" />
        </Button>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-20">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              {todo.title}
            </CardTitle>
            <div className="flex items-center space-x-4 mt-3">
              <Badge className={`${getStatusColor(todo.status)} font-medium`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {getStatusLabel(todo.status)}
              </Badge>
              <div className="flex items-center text-xs text-gray-500 space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(todo.created_at), "MMM dd, yyyy")}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {todo.description && (
        <CardContent className="pt-0 pb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {todo.description}
          </p>
          <div className="flex items-center text-xs text-gray-400 mt-3 space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              Updated {format(new Date(todo.updated_at), "MMM dd, HH:mm")}
            </span>
          </div>
        </CardContent>
      )}

      {/* Enhanced Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-lg"></div>
          <div className="relative z-10">
            <DialogHeader className="space-y-3 pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Edit Todo
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Update your task details
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-title"
                  className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                >
                  <Target className="w-4 h-4" />
                  <span>Title</span>
                </Label>
                <Input
                  id="edit-title"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                  placeholder="Todo title"
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-description"
                  className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Description</span>
                </Label>
                <Textarea
                  id="edit-description"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  placeholder="Todo description (optional)"
                  rows={3}
                  className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-status"
                  className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                >
                  <StatusIcon className="w-4 h-4" />
                  <span>Status</span>
                </Label>
                <Select
                  value={editData.status}
                  onValueChange={(value: Todo["status"]) =>
                    setEditData({ ...editData, status: value })
                  }
                >
                  <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span>Pending</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span>In Progress</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Completed</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-2 hover:bg-gray-50 transition-colors duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isLoading || !editData.title.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Update</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="sm:max-w-md bg-gradient-to-br from-white to-red-50 border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 rounded-lg"></div>
          <div className="relative z-10">
            <AlertDialogHeader className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Delete Todo
                  </AlertDialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </AlertDialogHeader>

            <AlertDialogDescription className="py-4">
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800">
                      Are you sure you want to delete this todo?
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      <span className="font-semibold">"{todo.title}"</span> will
                      be permanently removed from your list.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>

            <AlertDialogFooter className="space-x-3 pt-4 border-t border-gray-200">
              <AlertDialogCancel className="border-2 hover:bg-gray-50 transition-colors duration-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {deleteLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </div>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
