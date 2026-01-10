import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'whatsapp';
  fullWidth?: boolean;
  icon?: React.ElementType;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  icon: Icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg text-sm md:text-base";
  
  const variants = {
    primary: "bg-brand-gold text-brand-dark hover:bg-yellow-400 border border-brand-gold",
    secondary: "bg-brand-primary text-brand-cream hover:bg-stone-700 border border-brand-primary",
    outline: "bg-transparent text-brand-gold border-2 border-brand-gold hover:bg-brand-gold/10",
    whatsapp: "bg-green-600 text-white hover:bg-green-500 border border-green-600",
  };

  const widthStyle = fullWidth ? "w-full" : "w-auto";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

export default Button;