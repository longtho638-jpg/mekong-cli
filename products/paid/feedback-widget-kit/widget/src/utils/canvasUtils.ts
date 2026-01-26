export interface Point {
  x: number;
  y: number;
}

export const getCoordinates = (event: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement): Point => {
  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

export const drawArrow = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string = 'red',
  width: number = 3
) => {
  const headLength = 15;
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
  ctx.lineTo(end.x, end.y);
  ctx.fillStyle = color;
  ctx.fill();
};

export const drawRect = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string = 'red',
  width: number = 3
) => {
  ctx.beginPath();
  ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
};
