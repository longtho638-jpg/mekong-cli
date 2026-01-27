import React from 'react';

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: 'google' | 'github' | 'discord';
  variant?: 'filled' | 'outline';
}

export const SocialLoginButton: React.FC<SocialButtonProps> = ({
  provider,
  variant = 'filled',
  className = '',
  ...props
}) => {
  const baseStyles = "flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const providerStyles = {
    google: {
      filled: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
      outline: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50"
    },
    github: {
      filled: "bg-[#24292F] text-white hover:bg-[#24292F]/90",
      outline: "bg-transparent text-[#24292F] border border-[#24292F] hover:bg-gray-50"
    },
    discord: {
      filled: "bg-[#5865F2] text-white hover:bg-[#5865F2]/90",
      outline: "bg-transparent text-[#5865F2] border border-[#5865F2] hover:bg-gray-50"
    }
  };

  const labels = {
    google: "Sign in with Google",
    github: "Sign in with GitHub",
    discord: "Sign in with Discord"
  };

  return (
    <button
      className={`${baseStyles} ${providerStyles[provider][variant]} ${className}`}
      {...props}
    >
      {/* Icon placeholder - replace with SVG icons */}
      <span className="mr-2 capitalize">{provider}</span>
      {props.children || labels[provider]}
    </button>
  );
};
