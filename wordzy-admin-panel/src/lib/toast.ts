
import { useToast } from "@/components/ui/use-toast";

export function useNotify() {
  const { toast } = useToast();
  
  const notify = {
    success: (message: string) => {
      toast({
        title: "Success",
        description: message,
        variant: "default",
      });
    },
    error: (message: string) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };
  
  return notify;
}
