import React from 'react';
import { useSocialLogin } from '../hooks/useSocialLogin';

type SocialProvider = 'google' | 'github' | 'discord';

interface SocialLoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: SocialProvider;
  variant?: 'filled' | 'outlined';
  showIcon?: boolean;
  label?: string;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
    </g>
  </svg>
);

const GithubIcon = () => (
  <svg height="24" width="24" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
  </svg>
);

const DiscordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 127.14 96.36">
    <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.91-23.29-1.32-48.43-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
  </svg>
);

const providerConfig: Record<SocialProvider, { label: string; icon: React.FC; color: string; hoverColor: string }> = {
  google: {
    label: 'Continue with Google',
    icon: GoogleIcon,
    color: '#FFFFFF',
    hoverColor: '#F8F9FA'
  },
  github: {
    label: 'Continue with GitHub',
    icon: GithubIcon,
    color: '#24292e',
    hoverColor: '#2f363d'
  },
  discord: {
    label: 'Continue with Discord',
    icon: DiscordIcon,
    color: '#5865F2',
    hoverColor: '#4752C4'
  }
};

/**
 * Social Login Button Component
 * Follows MD3 design principles
 */
export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  variant = 'filled',
  showIcon = true,
  label,
  className = '',
  style,
  ...props
}) => {
  const { initiateLogin, isLoading } = useSocialLogin();
  const config = providerConfig[provider];
  const Icon = config.icon;

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '0 24px',
    height: '40px',
    borderRadius: '20px', // MD3 pill shape
    border: variant === 'outlined' ? '1px solid #79747E' : 'none',
    backgroundColor: variant === 'filled' ? config.color : 'transparent',
    color: variant === 'filled' && provider !== 'google' ? '#FFFFFF' : '#1D1B20',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Roboto, sans-serif',
    cursor: isLoading ? 'wait' : 'pointer',
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: variant === 'filled'
      ? '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
      : 'none',
    ...style
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = variant === 'filled' ? config.hoverColor : 'rgba(29, 27, 32, 0.08)';
    if (variant === 'filled') {
      e.currentTarget.style.boxShadow = '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = variant === 'filled' ? config.color : 'transparent';
    if (variant === 'filled') {
      e.currentTarget.style.boxShadow = '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)';
    }
  };

  return (
    <button
      onClick={() => initiateLogin(provider)}
      disabled={isLoading}
      style={baseStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`social-login-btn ${className}`}
      {...props}
    >
      {showIcon && <Icon />}
      <span>{isLoading ? 'Connecting...' : (label || config.label)}</span>
    </button>
  );
};
