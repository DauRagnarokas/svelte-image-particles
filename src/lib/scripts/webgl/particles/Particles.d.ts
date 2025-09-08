export namespace PARTICLE_PARAMS {
    let pixelStep: number;
    let maxParticles: number;
    let darknessThreshold: number;
    let alphaMin: number;
    let uRandom: number;
    let uDepth: number;
    let uSize: number;
    let uEdge: number;
    let uSharpness: number;
}
export default class Particles {
    constructor(webgl: any, overrides?: {});
    webgl: any;
    container: any;
    params: {
        pixelStep: number;
        maxParticles: number;
        darknessThreshold: number;
        alphaMin: number;
        uRandom: number;
        uDepth: number;
        uSize: number;
        uEdge: number;
        uSharpness: number;
    };
    _tweens: any[];
    _tween(uniform: any, toValue: any, duration: number, ease: (t: any) => any, onComplete: any): void;
    _set(uniform: any, value: any): void;
    _updateTweens(dt: any): void;
    setParams(next?: {}): void;
    init(src: any): void;
    texture: any;
    width: any;
    height: any;
    initPoints(discard: any): void;
    numPoints: number;
    object3D: any;
    initTouch(): void;
    touch: TouchTexture;
    initHitArea(): void;
    hitArea: any;
    addListeners(): void;
    handlerInteractiveMove: any;
    removeListeners(): void;
    update(delta: any): void;
    show(time?: number): void;
    hide(_destroy: any, time?: number): Promise<any>;
    destroy(): void;
    resize(): void;
    onInteractiveMove(e: any): void;
}
import TouchTexture from './TouchTexture';
