import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  selected?: boolean;
  onClick: () => void;
}

export function RoleCard({ title, description, icon: Icon, selected, onClick }: RoleCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-medium hover:scale-105",
        "border-2 bg-gradient-secondary",
        selected 
          ? "border-primary bg-gradient-primary shadow-medium" 
          : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <div className={cn(
          "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
          selected 
            ? "bg-white/20 text-white" 
            : "bg-primary/10 text-primary"
        )}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className={cn(
          "mb-2 text-xl font-semibold",
          selected ? "text-white" : "text-foreground"
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-sm",
          selected ? "text-white/80" : "text-muted-foreground"
        )}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}