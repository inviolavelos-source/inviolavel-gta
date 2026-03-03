import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconClassName?: string;
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
}

export function Logo({ className, iconClassName, size = "md", showText = true }: LogoProps) {
    const sizes = {
        sm: { text: "text-lg", icon: "h-4 w-4", spacing: "gap-1" },
        md: { text: "text-2xl", icon: "h-5 w-5", spacing: "gap-1.5" },
        lg: { text: "text-4xl", icon: "h-8 w-8", spacing: "gap-2" },
        xl: { text: "text-6xl", icon: "h-12 w-12", spacing: "gap-3" },
    };

    const currentSize = sizes[size];

    return (
        <div className={cn("inline-flex items-center font-black tracking-tighter select-none", currentSize.spacing, className)}>
            {showText && (
                <div className={cn("flex items-center", currentSize.text)}>
                    <span>INVI</span>
                    <div className="relative flex items-center justify-center mx-[0.05em]">
                        <span className="opacity-0">O</span>
                        <Lock
                            className={cn(
                                "absolute inset-0 m-auto text-primary animate-in fade-in zoom-in duration-700",
                                currentSize.icon,
                                iconClassName
                            )}
                            strokeWidth={3}
                        />
                    </div>
                    <span>LÁVEL</span>
                </div>
            )}
            {!showText && (
                <div className={cn("flex items-center justify-center bg-primary rounded-xl p-2 shadow-lg shadow-primary/20", iconClassName)}>
                    <Lock className={cn("text-primary-foreground", currentSize.icon)} strokeWidth={2.5} />
                </div>
            )}
        </div>
    );
}
