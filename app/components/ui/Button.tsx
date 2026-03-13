interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  [key: string]: unknown;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-black text-white hover:bg-black/80",
    secondary: "bg-white text-black border border-black/20 hover:bg-black/5",
    ghost: "text-black/60 hover:text-black hover:bg-black/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      className={`font-semibold transition-colors duration-200 rounded-sm tracking-wide ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}