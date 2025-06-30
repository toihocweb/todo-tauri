import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  Plus,
  Sparkles,
  Target,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { CreateTodoInput, Todo } from "@/types/todo";

interface AddTodoDialogProps {
  onAdd: (input: CreateTodoInput) => Promise<void>;
  trigger?: React.ReactNode;
}

const statusIcons = {
  pending: Clock,
  in_progress: Target,
  completed: CheckCircle,
};

const statusColors = {
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  in_progress: "text-blue-600 bg-blue-50 border-blue-200",
  completed: "text-green-600 bg-green-50 border-green-200",
};

export function AddTodoDialog({ onAdd, trigger }: AddTodoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: "",
    description: "",
    status: "pending",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      await onAdd(formData);
      setFormData({ title: "", description: "", status: "pending" });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add todo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({ title: "", description: "", status: "pending" });
  };

  const StatusIcon = statusIcons[formData.status];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-md blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <Plus className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Add Todo</span>
            <Sparkles className="w-3 h-3 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-lg"></div>
        <div className="relative z-10">
          <DialogHeader className="space-y-3 pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create New Todo
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new task to your productivity journey
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
              >
                <Target className="w-4 h-4" />
                <span>Title</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="What needs to be done?"
                required
                className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Description</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add more details about this task..."
                rows={3}
                className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 bg-white/80 backdrop-blur-sm resize-none"
              />
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
              >
                <StatusIcon className="w-4 h-4" />
                <span>Status</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: Todo["status"]) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span>Pending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress" className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span>In Progress</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed" className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Completed</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Preview */}
            <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 bg-white/50">
              <div className="flex items-center space-x-2">
                <StatusIcon
                  className={`w-4 h-4 ${
                    statusColors[formData.status].split(" ")[0]
                  }`}
                />
                <span className="text-sm font-medium text-gray-600">
                  This todo will be created as:{" "}
                  <span className="font-semibold">
                    {formData.status.replace("_", " ")}
                  </span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-2 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button 
                  type="submit" 
                  disabled={isLoading || !formData.title.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Todo</span>
                    </div>
                  )}
                </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
