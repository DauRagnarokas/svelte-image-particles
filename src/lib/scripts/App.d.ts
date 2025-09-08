export default class App {
    /**
     * imageSrc: string
     * options?: { container?: HTMLElement }
     */
    constructor(imageSrc?: string, options?: {});
    imageSrc: string;
    container: any;
    _disposed: boolean;
    animate(): void;
    resize(): void;
    onVisibilityChange(): void;
    click(): void;
    init(): void;
    initWebGL(): void;
    webgl: WebGLView;
    canvas: any;
    mountTarget: any;
    addListeners(): void;
    removeListeners(): void;
    raf: number;
    update(): void;
    draw(): void;
    setParams(overrides?: {}): void;
    setImage(src: any): void;
    dispose(): void;
}
import WebGLView from './webgl/WebGLView';
