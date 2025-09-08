export default class TouchTexture {
    constructor(parent: any);
    parent: any;
    size: number;
    maxAge: number;
    radius: number;
    trail: any[];
    initTexture(): void;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    texture: any;
    update(delta: any): void;
    clear(): void;
    addTouch(point: any): void;
    drawTouch(point: any): void;
}
