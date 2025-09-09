export default class InteractiveControls {
    constructor(camera: any, el: any);
    get enabled(): boolean;
    camera: any;
    el: any;
    plane: any;
    raycaster: any;
    mouse: any;
    offset: any;
    intersection: any;
    objects: any[];
    hovered: any;
    selected: any;
    isDown: boolean;
    pointer: {
        x: number;
        y: number;
        x01: number;
        y01: number;
        isDown: boolean;
    };
    rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    enable(): void;
    _enabled: boolean;
    disable(): void;
    addListeners(): void;
    handlerDown: any;
    handlerMove: any;
    handlerUp: any;
    handlerLeave: any;
    removeListeners(): void;
    resize(x: any, y: any, width: any, height: any): void;
    onMove(e: any): void;
    intersectionData: any;
    onDown(e: any): void;
    onUp(): void;
    onLeave(): void;
}
