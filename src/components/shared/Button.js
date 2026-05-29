import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export function Button({ variant = 'primary', size = 'md', loading = false, children, disabled, ...props }) {
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 font-sans flex items-center justify-center gap-2';
    const sizeStyles = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };
    const variantStyles = {
        primary: 'bg-[#002045] text-white hover:bg-[#006b5f] active:scale-[0.98]',
        secondary: 'bg-[#006b5f] text-white hover:bg-[#005148] active:scale-[0.98]',
        outline: 'border-2 border-[#006b5f] text-[#006b5f] hover:bg-[#006b5f]/5',
        ghost: 'text-[#006b5f] hover:bg-[#eff4ff]',
    };
    return (_jsxs(motion.button, { whileHover: disabled || loading ? {} : { scale: 1.02 }, whileTap: disabled || loading ? {} : { scale: 0.98 }, disabled: disabled || loading, className: `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} disabled:opacity-50 disabled:cursor-not-allowed`, ...props, children: [loading && _jsx("div", { className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" }), children] }));
}
