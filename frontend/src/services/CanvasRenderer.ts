/**
 * CanvasRenderer.ts
 * 负责将结果数据绘制到 Canvas 并生成图片
 */

export interface Layer {
  type: 'text' | 'image' | 'rect' | 'qrcode' | 'circle' | 'line';
  content?: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  gradient?: {
    colors: string[];
    direction: 'horizontal' | 'vertical';
  };
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  opacity?: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(width: number = 750, height: number = 1334) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  async render(layers: Layer[], data: Record<string, any>): Promise<string> {
    // 初始清空背景
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const layer of layers) {
      await this.drawLayer(layer, data);
    }

    return this.canvas.toDataURL('image/png');
  }

  private async drawLayer(layer: Layer, data: Record<string, any>) {
    const { 
      type, x, y, width, height, color, fontSize, content, 
      borderRadius, fontWeight, textAlign, gradient, shadow, opacity 
    } = layer;
    
    // 解析占位符 {variableName}
    const resolvedContent = content?.replace(/\{(\w+)\}/g, (_, key) => {
      const val = data[key];
      return val !== undefined ? String(val) : '';
    });

    this.ctx.save();

    // 设置全局透明度
    if (opacity !== undefined) {
      this.ctx.globalAlpha = opacity;
    }

    // 设置阴影
    if (shadow) {
      this.ctx.shadowColor = shadow.color;
      this.ctx.shadowBlur = shadow.blur;
      this.ctx.shadowOffsetX = shadow.offsetX;
      this.ctx.shadowOffsetY = shadow.offsetY;
    }

    // 处理填充色或渐变
    if (gradient) {
      let grd;
      if (gradient.direction === 'horizontal') {
        grd = this.ctx.createLinearGradient(x, y, x + (width || 0), y);
      } else {
        grd = this.ctx.createLinearGradient(x, y, x, y + (height || 0));
      }
      gradient.colors.forEach((c, i) => {
        grd.addColorStop(i / (gradient.colors.length - 1), c);
      });
      this.ctx.fillStyle = grd;
    } else {
      this.ctx.fillStyle = color || '#000000';
    }

    switch (type) {
      case 'text':
        this.ctx.font = `${fontWeight || 'normal'} ${fontSize || 24}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        this.ctx.textAlign = textAlign || 'left';
        this.ctx.textBaseline = 'top';
        
        if (textAlign === 'center') {
          this.ctx.fillText(resolvedContent || '', x, y);
        } else if (textAlign === 'right') {
          this.ctx.fillText(resolvedContent || '', x, y);
        } else {
          this.ctx.fillText(resolvedContent || '', x, y);
        }
        break;

      case 'rect':
        if (borderRadius) {
          this.drawRoundedRect(x, y, width || 0, height || 0, borderRadius);
        } else {
          this.ctx.fillRect(x, y, width || 0, height || 0);
        }
        break;

      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(x, y, (width || 0) / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'line':
        this.ctx.strokeStyle = color || '#000000';
        this.ctx.lineWidth = height || 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + (width || 0), y);
        this.ctx.stroke();
        break;

      case 'image':
        if (resolvedContent) {
          try {
            const img = await this.loadImage(resolvedContent);
            if (borderRadius) {
              this.ctx.save();
              this.drawRoundedRect(x, y, width || img.width, height || img.height, borderRadius, false);
              this.ctx.clip();
              this.ctx.drawImage(img, x, y, width || img.width, height || img.height);
              this.ctx.restore();
            } else {
              this.ctx.drawImage(img, x, y, width || img.width, height || img.height);
            }
          } catch (e) {
            console.warn('Image load failed:', resolvedContent);
          }
        }
        break;
    }

    this.ctx.restore();
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, fill = true) {
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
    if (fill) this.ctx.fill();
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
