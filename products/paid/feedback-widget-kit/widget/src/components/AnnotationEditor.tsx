import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Undo, Type, Square, ArrowRight, Pen } from 'lucide-react';
import { drawArrow, drawRect, getCoordinates, Point } from '../utils/canvasUtils';

export interface AnnotationEditorProps {
  screenshotUrl: string;
  onSave: (editedUrl: string) => void;
  onCancel: () => void;
}

type Tool = 'pen' | 'arrow' | 'rect' | 'text';

interface DrawingAction {
  tool: Tool;
  points: Point[]; // For pen
  start?: Point;   // For shapes
  end?: Point;     // For shapes
  color: string;
  text?: string;   // For text tool
}

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  screenshotUrl,
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('arrow');
  const [color, setColor] = useState('#ef4444'); // red-500
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [history, setHistory] = useState<DrawingAction[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]); // For pen path
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Initialize canvas with image
  useEffect(() => {
    const img = new Image();
    img.src = screenshotUrl;
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        redraw();
      }
    };
  }, [screenshotUrl]);

  // Re-draw canvas whenever history changes
  useEffect(() => {
    redraw();
  }, [history]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background image
    const img = new Image();
    img.src = screenshotUrl;
    // We assume image is loaded since we set size based on it,
    // but practically we might need to handle async loading better if image is large.
    // However, screenshotUrl is a data URL so it should be fast/instant after first load.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw history
    history.forEach(action => {
      ctx.strokeStyle = action.color;
      ctx.fillStyle = action.color;
      ctx.lineWidth = 3;

      if (action.tool === 'pen') {
        ctx.beginPath();
        action.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (action.tool === 'arrow' && action.start && action.end) {
        drawArrow(ctx, action.start, action.end, action.color);
      } else if (action.tool === 'rect' && action.start && action.end) {
        drawRect(ctx, action.start, action.end, action.color);
      }
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const point = getCoordinates(e, canvasRef.current);
    setIsDrawing(true);
    setStartPoint(point);
    if (tool === 'pen') {
      setCurrentPoints([point]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const currentPoint = getCoordinates(e, canvasRef.current);

    // Redraw everything first
    redraw();

    // Draw current action preview
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    if (tool === 'pen') {
      const newPoints = [...currentPoints, currentPoint];
      setCurrentPoints(newPoints);
      ctx.beginPath();
      newPoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    } else if (tool === 'arrow') {
      drawArrow(ctx, startPoint, currentPoint, color);
    } else if (tool === 'rect') {
      drawRect(ctx, startPoint, currentPoint, color);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !canvasRef.current) return;
    setIsDrawing(false);
    const endPoint = getCoordinates(e, canvasRef.current);

    const newAction: DrawingAction = {
      tool,
      color,
      points: tool === 'pen' ? currentPoints : [],
      start: startPoint,
      end: endPoint,
    };

    setHistory([...history, newAction]);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  const handleUndo = () => {
    setHistory(prev => prev.slice(0, -1));
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex flex-col items-center justify-center p-4">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-full px-6 py-3 mb-4 flex items-center gap-4 shadow-xl">
        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-4">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${tool === 'pen' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => setTool('arrow')}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${tool === 'arrow' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ${tool === 'rect' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-300'}`}
          >
            <Square size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-4">
          {['#ef4444', '#22c55e', '#3b82f6', '#eab308'].map(c => (
             <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white ring-2 ring-slate-400' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
             />
          ))}
        </div>

        <button
          onClick={handleUndo}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          disabled={history.length === 0}
        >
          <Undo size={20} />
        </button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative max-w-full max-h-[80vh] overflow-auto rounded-lg shadow-2xl bg-black border border-slate-700"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          className="cursor-crosshair block"
          style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-medium transition-colors"
        >
          <X size={18} /> Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors"
        >
          <Check size={18} /> Save Annotation
        </button>
      </div>
    </div>
  );
};
