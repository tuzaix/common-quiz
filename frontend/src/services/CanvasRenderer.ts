/**
 * CanvasRenderer.ts
 * 负责将结果数据绘制到 Canvas 并生成图片
 */

export interface Layer {
  type: 'text' | 'image' | 'rect' | 'qrcode';
  content?: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number = 750, height: number = 1334) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async render(layers: Layer[], data: Record<string, any>): Promise<string> {
    // 填充背景
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const layer of layers) {
      await this.drawLayer(layer, data);
    }

    return this.canvas.toDataURL('image/png');
  }

  private async drawLayer(layer: Layer, data: Record<string, any>) {
    const { type, x, y, width, height, color, fontSize, content, borderRadius } = layer;
    
    // 解析占位符 {variableName}
    const resolvedContent = content?.replace(/\{(\w+)\}/g, (_, key) => data[key] || '');

    switch (type) {
      case 'text':
        this.ctx.fillStyle = color || '#000000';
        this.ctx.font = `${fontSize || 24}px sans-serif`;
        this.ctx.fillText(resolvedContent || '', x, y);
        break;

      case 'rect':
        this.ctx.fillStyle = color || '#000000';
        if (borderRadius) {
          this.drawRoundedRect(x, y, width || 0, height || 0, borderRadius);
        } else {
          this.ctx.fillRect(x, y, width || 0, height || 0);
        }
        break;

      case 'image':
        if (resolvedContent) {
          const img = await this.loadImage(resolvedContent);
          this.ctx.drawImage(img, x, y, width || img.width, height || img.height);
        }
        break;
    }
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}
