export default class WebGLView {
    constructor(app: any, imageSrc?: string);
    app: any;
    imageSrc: string;
    initThree(): void;
    scene: any;
    camera: any;
    renderer: any;
    clock: any;
    initControls(): void;
    interactive: InteractiveControls;
    initParticles(): void;
    particles: Particles;
    update(): void;
    draw(): void;
    resize(): void;
    fovHeight: number;
}
import InteractiveControls from './InteractiveControls';
import Particles from './Particles';
