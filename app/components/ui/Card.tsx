interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`bg-white border border-black/10 p-6 ${
        hover ? "hover:border-black/30 transition-colors duration-200" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}