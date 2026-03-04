"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  children: React.ReactNode;
  className?: string;
}

export function SidePanel({ children, className }: SidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Pequeno delay para evitar aviso de renderização em cascata do linter
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("side-panel-collapsed");
      if (stored === "true") {
        setIsCollapsed(true);
      }
      setIsMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("side-panel-collapsed", String(newState));
  };

  if (!isMounted) {
    return (
      <div className={cn("w-full lg:w-80 bg-background border-l", className)}>
        <div className="p-6 space-y-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-w-0">
      <div
        className={cn(
          "transition-all duration-300 ease-in-out border-l bg-background overflow-hidden h-full shrink-0",
          isCollapsed ? "w-0" : "w-full md:w-80 lg:w-80",
          className
        )}
      >
        <div className={cn("w-full md:w-80 lg:w-80 p-6 space-y-6 shrink-0", isCollapsed && "invisible")}>
          {children}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className={cn(
          "absolute top-4 -left-4 z-10 h-8 w-8 rounded-full bg-background shadow-sm hover:bg-accent transition-all duration-300"
        )}
        onClick={toggleCollapse}
        title={isCollapsed ? "Expandir" : "Recolher"}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
