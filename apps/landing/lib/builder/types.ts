export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  SCROLL = 'scroll',
  FORM_SUBMISSION = 'form_submission',
}

export type ComponentType = 'hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'text' | 'image' | 'button' | 'form';

export interface ComponentProperty {
  name: string;
  type: 'text' | 'color' | 'number' | 'select' | 'boolean' | 'image' | 'json';
  label: string;
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

export interface LandingComponent {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: LandingComponent[]; // For nested structures if needed, though we might keep it flat for v1
}

export interface PageMetadata {
  title: string;
  description: string;
  slug: string;
  ogImage: string;
}

export interface BuilderState {
  components: LandingComponent[];
  selectedId: string | null;
  history: LandingComponent[][]; // For undo/redo
  historyIndex: number;
  device: 'desktop' | 'tablet' | 'mobile';
  metadata: PageMetadata;
}

export type BuilderAction =
  | { type: 'ADD_COMPONENT'; payload: { type: ComponentType; index?: number } }
  | { type: 'REMOVE_COMPONENT'; payload: { id: string } }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; props: Record<string, any> } }
  | { type: 'SELECT_COMPONENT'; payload: { id: string | null } }
  | { type: 'MOVE_COMPONENT'; payload: { activeId: string; overId: string } }
  | { type: 'SET_DEVICE'; payload: { device: 'desktop' | 'tablet' | 'mobile' } }
  | { type: 'UPDATE_METADATA'; payload: Partial<PageMetadata> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_TEMPLATE'; payload: { components: LandingComponent[] } };

export const COMPONENT_DEFINITIONS: Record<ComponentType, { label: string; icon: string; properties: ComponentProperty[] }> = {
  hero: {
    label: 'Hero Section',
    icon: 'LayoutTemplate',
    properties: [
      { name: 'title', type: 'text', label: 'Title', defaultValue: 'Welcome to our Product' },
      { name: 'subtitle', type: 'text', label: 'Subtitle', defaultValue: 'The best solution for your needs' },
      { name: 'ctaText', type: 'text', label: 'CTA Text', defaultValue: 'Get Started' },
      { name: 'ctaLink', type: 'text', label: 'CTA Link', defaultValue: '#' },
      { name: 'backgroundImage', type: 'image', label: 'Background Image', defaultValue: '' },
      { name: 'alignment', type: 'select', label: 'Alignment', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }], defaultValue: 'center' },
    ]
  },
  features: {
    label: 'Features Grid',
    icon: 'Grid',
    properties: [
      { name: 'title', type: 'text', label: 'Title', defaultValue: 'Our Features' },
      { name: 'columns', type: 'number', label: 'Columns', defaultValue: 3 },
    ]
  },
  pricing: {
    label: 'Pricing Table',
    icon: 'DollarSign',
    properties: [
      { name: 'title', type: 'text', label: 'Title', defaultValue: 'Simple Pricing' },
    ]
  },
  cta: {
    label: 'Call to Action',
    icon: 'Megaphone',
    properties: [
      { name: 'title', type: 'text', label: 'Title', defaultValue: 'Ready to get started?' },
      { name: 'buttonText', type: 'text', label: 'Button Text', defaultValue: 'Sign Up Now' },
      { name: 'backgroundColor', type: 'color', label: 'Background Color', defaultValue: '#f3f4f6' },
    ]
  },
  testimonials: {
    label: 'Testimonials',
    icon: 'MessageSquareQuote',
    properties: [
      { name: 'title', type: 'text', label: 'Title', defaultValue: 'What our customers say' },
    ]
  },
  text: {
    label: 'Text Block',
    icon: 'Type',
    properties: [
      { name: 'content', type: 'text', label: 'Content', defaultValue: 'Lorem ipsum dolor sit amet...' },
      { name: 'fontSize', type: 'select', label: 'Font Size', options: [{ label: 'Small', value: 'sm' }, { label: 'Medium', value: 'base' }, { label: 'Large', value: 'lg' }, { label: 'Extra Large', value: 'xl' }], defaultValue: 'base' },
    ]
  },
  image: {
    label: 'Image',
    icon: 'Image',
    properties: [
      { name: 'src', type: 'image', label: 'Image URL', defaultValue: 'https://via.placeholder.com/600x400' },
      { name: 'alt', type: 'text', label: 'Alt Text', defaultValue: 'Image' },
    ]
  },
  button: {
    label: 'Button',
    icon: 'MousePointerClick',
    properties: [
      { name: 'text', type: 'text', label: 'Text', defaultValue: 'Click Me' },
      { name: 'link', type: 'text', label: 'Link', defaultValue: '#' },
      { name: 'variant', type: 'select', label: 'Variant', options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }], defaultValue: 'primary' },
    ]
  },
  form: {
    label: 'Form',
    icon: 'FormInput',
    properties: [
      { name: 'title', type: 'text', label: 'Form Title', defaultValue: 'Contact Us' },
      { name: 'submitText', type: 'text', label: 'Submit Button Text', defaultValue: 'Submit' },
      { name: 'fields', type: 'json', label: 'Fields Configuration', defaultValue: [] },
    ]
  }
};
