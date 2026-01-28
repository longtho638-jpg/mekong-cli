import React, { ReactNode } from 'react';

// --- Types ---

interface MD3Props {
  children?: ReactNode;
  className?: string;
  [key: string]: any;
}

interface ButtonProps extends MD3Props {
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'error' | 'success';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

interface TypographyProps extends MD3Props {
  variant?:
    | 'display-large' | 'display-medium' | 'display-small'
    | 'headline-large' | 'headline-medium' | 'headline-small'
    | 'title-large' | 'title-medium' | 'title-small'
    | 'body-large' | 'body-medium' | 'body-small'
    | 'label-large' | 'label-medium' | 'label-small';
  component?: any;
}

interface CardProps extends MD3Props {
  variant?: 'elevated' | 'filled' | 'outlined';
}

interface ChipProps extends MD3Props {
    label: string;
    variant?: 'assist' | 'filter' | 'input' | 'suggestion';
    selected?: boolean;
    onDelete?: () => void;
}

interface DataTableProps {
    columns: {
        header: string;
        accessor: string;
        render?: (row: any) => ReactNode;
    }[];
    data: any[];
    selectable?: boolean;
    onSelectionChange?: (selectedIds: string[]) => void;
}

interface TextFieldProps extends MD3Props {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: string;
    placeholder?: string;
    helperText?: string;
    error?: boolean;
    multiline?: boolean;
    rows?: number;
}

interface SelectProps extends MD3Props {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string; label: string }[];
}

interface DialogProps extends MD3Props {
    open: boolean;
    onClose: () => void;
    title: string;
    actions?: ReactNode;
}

// --- Components ---

export const MD3TextField: React.FC<TextFieldProps> = ({
    label, value, onChange, type = 'text', placeholder, helperText, error, multiline, rows = 4, className = '', ...props
}) => {
    const baseInputStyle = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border";

    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {multiline ? (
                <textarea
                    rows={rows}
                    className={`${baseInputStyle}`}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    {...props}
                />
            ) : (
                <input
                    type={type}
                    className={`${baseInputStyle}`}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    {...props}
                />
            )}
            {helperText && <p className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-gray-500'}`}>{helperText}</p>}
        </div>
    );
};

export const MD3Select: React.FC<SelectProps> = ({
    label, value, onChange, options, className = '', ...props
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                value={value}
                onChange={onChange}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

export const MD3Dialog: React.FC<DialogProps> = ({
    open, onClose, title, children, actions, className = '', ...props
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">{title}</h3>
                                <div className="mt-2">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                    {actions && (
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const MD3Button: React.FC<ButtonProps> = ({
  children, variant = 'filled', className = '', startIcon, endIcon, color = 'primary', size = 'medium', ...props
}) => {
  // Simplified styling for demo purposes - in real MD3 these would be complex classes or Tailwind utilities
  const baseStyle = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    filled: "bg-blue-600 text-white hover:bg-blue-700",
    outlined: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    text: "text-blue-600 hover:bg-blue-50",
    elevated: "bg-white text-blue-600 shadow-md hover:bg-gray-50",
    tonal: "bg-blue-100 text-blue-900 hover:bg-blue-200"
  };

  const sizes = {
      small: "px-3 py-1 text-sm",
      medium: "px-5 py-2.5 text-sm",
      large: "px-6 py-3 text-base"
  };

  const colorStyles = color === 'error' && variant === 'text' ? "text-red-600 hover:bg-red-50" : "";

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${colorStyles} ${className} gap-2`} {...props}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </button>
  );
};

export const MD3Card: React.FC<CardProps> = ({ children, variant = 'elevated', className = '', ...props }) => {
  const baseStyle = "rounded-xl overflow-hidden";
  const variants = {
    elevated: "bg-white shadow-md",
    filled: "bg-gray-100",
    outlined: "bg-white border border-gray-200"
  };

  return (
    <div className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const MD3Typography: React.FC<TypographyProps> = ({ children, variant = 'body-medium', component, className = '', ...props }) => {
    // Mapping generic variants to Tailwind classes roughly approximating MD3 type scale
    const styles = {
        'display-large': "text-6xl font-normal leading-tight",
        'display-medium': "text-5xl font-normal leading-tight",
        'display-small': "text-4xl font-normal leading-tight",
        'headline-large': "text-3xl font-normal leading-tight",
        'headline-medium': "text-2xl font-normal leading-tight",
        'headline-small': "text-xl font-normal leading-tight",
        'title-large': "text-xl font-medium leading-normal",
        'title-medium': "text-base font-medium leading-normal tracking-wide",
        'title-small': "text-sm font-medium leading-normal tracking-wide",
        'body-large': "text-base font-normal leading-normal tracking-wide",
        'body-medium': "text-sm font-normal leading-normal tracking-wide",
        'body-small': "text-xs font-normal leading-normal tracking-wide",
        'label-large': "text-sm font-medium leading-normal tracking-wide",
        'label-medium': "text-xs font-medium leading-normal tracking-wide",
        'label-small': "text-[10px] font-medium leading-normal tracking-wide",
    };

    const Component = component || 'p';

    return (
        <Component className={`${styles[variant]} ${className}`} {...props}>
            {children}
        </Component>
    );
};

export const MD3Chip: React.FC<ChipProps> = ({ label, variant = 'assist', className = '', ...props }) => {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200 ${className}`} {...props}>
            {label}
        </span>
    );
}

export const MD3DataTable: React.FC<DataTableProps> = ({ columns, data, selectable, onSelectionChange }) => {
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                    <tr>
                        {selectable && <th className="px-6 py-3 w-4"><input type="checkbox" /></th>}
                        {columns.map((col, idx) => (
                            <th key={idx} className="px-6 py-3">{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {data.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50">
                            {selectable && <td className="px-6 py-4"><input type="checkbox" /></td>}
                            {columns.map((col, cIdx) => (
                                <td key={cIdx} className="px-6 py-4 whitespace-nowrap">
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
