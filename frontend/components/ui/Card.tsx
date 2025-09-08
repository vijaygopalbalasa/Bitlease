import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
}

export function Card({ children, className = '', title, description, footer }: CardProps) {
  return (
    <div className={`bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 overflow-hidden shadow-xl rounded-lg ${className}`}>
      {(title || description) && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-700/50">
          {title && <h3 className="text-lg leading-6 font-medium text-white">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-300">{description}</p>}
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">{children}</div>
      {footer && (
        <div className="bg-gray-800/50 px-4 py-4 sm:px-6 border-t border-gray-700/50">
          {footer}
        </div>
      )}
    </div>
  );
}

interface CardGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function CardGrid({ children, className = '', cols = 3 }: CardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-6 ${className}`}>
      {children}
    </div>
  );
}
