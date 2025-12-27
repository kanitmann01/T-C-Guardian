import { ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils";

interface BackButtonProps {
    onClick: () => void;
    label?: string;
    className?: string;
}

export const BackButton = ({ onClick, label = "Back", className }: BackButtonProps) => {
    return (
        <button 
            onClick={onClick} 
            className={cn(
                "flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-4 md:mb-6 group relative z-20",
                "active:scale-95 transition-transform",
                className
            )}
            aria-label={label}
        >
            <div className="p-1 rounded-full group-hover:bg-white/10 transition-colors">
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
};


