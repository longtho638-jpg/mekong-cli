import React, { useState, useEffect } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardChart, ChartProps } from './chart-components';
import { KPICard, KPIProps } from './kpi-card';
import { GripVertical } from 'lucide-react';

// --- Types ---

export type WidgetType = 'chart' | 'kpi' | 'text';

export interface WidgetBase {
  id: string;
  type: WidgetType;
  title?: string;
}

export interface ChartWidget extends WidgetBase {
  type: 'chart';
  props: Omit<ChartProps, 'height'>;
}

export interface KPIWidget extends WidgetBase {
  type: 'kpi';
  props: KPIProps;
}

export interface TextWidget extends WidgetBase {
  type: 'text';
  content: string;
}

export type DashboardWidget = ChartWidget | KPIWidget | TextWidget;

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  layout: Layout[];
}

interface DashboardBuilderProps {
  config: DashboardConfig;
  onLayoutChange?: (layout: Layout[]) => void;
  isEditable?: boolean;
}

// --- Widget Renderer ---

const WidgetRenderer = ({ widget }: { widget: DashboardWidget }) => {
  switch (widget.type) {
    case 'chart':
      return <DashboardChart {...(widget as ChartWidget).props} height={undefined} />; // Let parent container control height
    case 'kpi':
      return <KPICard {...(widget as KPIWidget).props} />;
    case 'text':
      return (
        <div className="h-full p-4 bg-[var(--md-sys-color-surface)] rounded-[var(--md-sys-shape-corner-medium)] border border-[var(--md-sys-color-outline-variant)]">
          <h3 className="m3-title-medium mb-2">{widget.title}</h3>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
            {(widget as TextWidget).content}
          </p>
        </div>
      );
    default:
      return <div>Unknown widget type</div>;
  }
};

// --- Main Component ---

export function DashboardBuilder({
  config,
  onLayoutChange,
  isEditable = false
}: DashboardBuilderProps) {
  const [layout, setLayout] = useState<Layout[]>(config.layout);
  const [width, setWidth] = useState(1200);

  // Responsive width handling
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('dashboard-grid-container');
      if (container) {
        setWidth(container.offsetWidth);
      }
    };

    // Initial resize
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  };

  return (
    <div id="dashboard-grid-container" className="w-full min-h-screen pb-20">
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={width}
        isDraggable={isEditable}
        isResizable={isEditable}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
        draggableHandle=".drag-handle"
      >
        {config.widgets.map((widget) => {
          const widgetLayout = layout.find(l => l.i === widget.id);

          return (
            <div key={widget.id} className="relative group">
              {/* Drag Handle (only visible in edit mode) */}
              {isEditable && (
                <div className="drag-handle absolute top-2 right-2 z-20 p-1 bg-[var(--md-sys-color-surface-container-high)] rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <GripVertical className="w-4 h-4 text-[var(--md-sys-color-on-surface)]" />
                </div>
              )}

              {/* Widget Content */}
              <div className="h-full w-full overflow-hidden">
                <WidgetRenderer widget={widget} />
              </div>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
}
