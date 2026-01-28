import React from 'react';
import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { cn } from '../../lib/utils';
import { LandingComponent, FormField } from '../../lib/builder/types';

export interface BlockProps {
  component: LandingComponent;
  isSelected?: boolean;
  onClick?: () => void;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
}

// --- Hero Block ---
export const HeroBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { title, subtitle, ctaText, ctaLink, backgroundImage, alignment } = component.props;

  return (
    <div
      className={cn(
        "relative py-20 px-6 flex flex-col justify-center min-h-[400px] bg-cover bg-center group",
        alignment === 'center' ? 'items-center text-center' : 'items-start text-left',
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      style={{ backgroundImage: backgroundImage ? `url(${backgroundImage as string})` : undefined }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {!backgroundImage && <div className="absolute inset-0 bg-gray-100 -z-10" />}
      <div className="absolute inset-0 bg-black/10 -z-10" /> {/* Overlay */}

      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4 drop-shadow-sm">
        {title as string}
      </h1>
      <p className="text-xl text-gray-700 mb-8 max-w-2xl drop-shadow-sm">
        {subtitle as string}
      </p>
      <a
        href={ctaLink as string}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2"
        onClick={(e) => e.preventDefault()} // Prevent navigation in editor
      >
        {ctaText as string}
      </a>
    </div>
  );
};

// --- Features Block ---
export const FeaturesBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { title, columns } = component.props;
  const cols = Number(columns) || 3;

  return (
    <div
      className={cn(
        "py-16 px-6 bg-white",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title as string}</h2>
        <div className={`grid gap-8 grid-cols-1 md:grid-cols-${cols}`}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                {/* Icon placeholder */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Feature {i + 1}</h3>
              <p className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- CTA Block ---
export const CtaBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { title, buttonText, backgroundColor } = component.props;

  return (
    <div
      className={cn(
        "py-16 px-6 text-center",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      style={{ backgroundColor: backgroundColor as string }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">{title as string}</h2>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 py-2">
          {buttonText as string}
        </button>
      </div>
    </div>
  );
};

// --- Pricing Block ---
export const PricingBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { title } = component.props;

  return (
    <div
      className={cn(
        "py-16 px-6 bg-gray-50",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">{title as string}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Placeholder pricing cards */}
           {[1, 2, 3].map((i) => (
             <div key={i} className="bg-white p-8 rounded-lg shadow-sm border">
               <h3 className="text-xl font-semibold mb-4">Plan {i}</h3>
               <p className="text-4xl font-bold mb-6">${i * 10}<span className="text-base font-normal text-gray-500">/mo</span></p>
               <ul className="space-y-3 text-left mb-8">
                 <li className="flex items-center text-sm text-gray-600">✓ Feature A</li>
                 <li className="flex items-center text-sm text-gray-600">✓ Feature B</li>
                 <li className="flex items-center text-sm text-gray-600">✓ Feature C</li>
               </ul>
               <button className="w-full py-2 px-4 border border-primary text-primary rounded hover:bg-primary/5 transition-colors">
                 Choose Plan
               </button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

// --- Testimonials Block ---
export const TestimonialsBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { title } = component.props;

  return (
    <div
      className={cn(
        "py-16 px-6 bg-white",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">{title as string}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-lg">
              <p className="text-lg italic text-gray-600 mb-6">"This product completely changed how we work. Highly recommended!"</p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="text-left">
                  <div className="font-semibold">User Name</div>
                  <div className="text-sm text-gray-500">CEO, Company {i}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Text Block ---
export const TextBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { content, fontSize } = component.props;

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div
      className={cn(
        "py-6 px-6 max-w-4xl mx-auto",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className={cn("prose max-w-none text-gray-700", sizeClasses[fontSize as keyof typeof sizeClasses] || 'text-base')}>
        {content as string}
      </div>
    </div>
  );
};

// --- Image Block ---
export const ImageBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { src, alt } = component.props;

  return (
    <div
      className={cn(
        "p-4 flex justify-center",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <img
        src={src as string}
        alt={alt as string}
        className="max-w-full h-auto rounded-lg shadow-sm"
      />
    </div>
  );
};

// --- Button Block ---
export const ButtonBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { text, link, variant } = component.props;

  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <div
      className={cn(
        "p-4 flex justify-center",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <a
        href={link as string}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2",
          variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary
        )}
        onClick={(e) => e.preventDefault()}
      >
        {text as string}
      </a>
    </div>
  );
};

// --- Form Block ---
export const FormBlock: React.FC<BlockProps> = ({ component, isSelected, onClick, attributes, listeners }) => {
  const { title, submitText, fields } = component.props;

  return (
    <div
      className={cn(
        "py-12 px-6 bg-gray-50",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm">
        <h3 className="text-2xl font-bold text-center mb-6">{title as string}</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {Array.isArray(fields) && (fields as FormField[]).map((field, idx) => (
            <div key={idx} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={field.type || 'text'}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled // Disabled in editor
              />
            </div>
          ))}
          {(!fields || (fields as unknown[]).length === 0) && (
             <div className="text-sm text-gray-500 italic text-center p-4 border border-dashed rounded">
                No fields configured. Edit properties to add fields.
             </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            disabled // Disabled in editor
          >
            {submitText as string}
          </button>
        </form>
      </div>
    </div>
  );
};

