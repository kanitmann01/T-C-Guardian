import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <Loader2 className={cn("animate-spin text-blue-400", sizeClasses[size])} />
            {text && <p className="text-sm text-slate-400">{text}</p>}
        </div>
    );
}

export function SkeletonLoader({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse space-y-4", className)}>
            <div className="h-4 bg-white/5 rounded w-3/4"></div>
            <div className="h-4 bg-white/5 rounded w-1/2"></div>
            <div className="h-4 bg-white/5 rounded w-5/6"></div>
        </div>
    );
}

export function ClauseCardSkeleton() {
    return (
        <div className="p-5 rounded-xl bg-white/5 border border-white/5 animate-pulse">
            <div className="flex justify-between items-start mb-3">
                <div className="h-6 bg-white/10 rounded-full w-32"></div>
                <div className="h-4 bg-white/10 rounded w-16"></div>
            </div>
            <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-5/6 mb-3"></div>
            <div className="h-12 bg-white/10 rounded-lg"></div>
        </div>
    );
}
