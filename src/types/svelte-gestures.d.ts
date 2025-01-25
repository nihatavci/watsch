declare module 'svelte-gestures' {
// Gesture Types
export type GestureType = 'tap' | 'press' | 'pan' | 'swipe' | 'pinch' | 'rotate';

// Basic Position Interface
export interface Position {
    x: number;
    y: number;
    timestamp: number;
}

// Common Event Data
export interface GestureEventData {
    /** Current x coordinate */
    x: number;
    /** Current y coordinate */
    y: number;
    /** Initial x coordinate when gesture started */
    initialX: number;
    /** Initial y coordinate when gesture started */
    initialY: number;
    /** Movement delta in x direction */
    dx: number;
    /** Movement delta in y direction */
    dy: number;
    /** Timestamp when gesture started */
    startTime: number;
    /** Current timestamp */
    timeStamp: number;
    /** Original DOM event */
    originalEvent: TouchEvent | MouseEvent;
    /** Target element */
    target: EventTarget | null;
}

// Specific Gesture Event Interfaces
export interface TapEventData extends GestureEventData {
    /** Number of taps */
    count: number;
}

export interface PressEventData extends GestureEventData {
    /** Duration of press in milliseconds */
    duration: number;
}

export interface PanEventData extends GestureEventData {
    /** Velocity in x direction */
    velocityX: number;
    /** Velocity in y direction */
    velocityY: number;
    /** Movement direction */
    direction: 'left' | 'right' | 'up' | 'down';
}

export interface SwipeEventData extends GestureEventData {
    /** Swipe direction */
    direction: 'left' | 'right' | 'up' | 'down';
    /** Swipe velocity */
    velocity: number;
}

// Configuration Options
export interface GestureOptions {
    /** Minimum press duration in ms */
    pressTimeout?: number;
    /** Maximum tap timeout in ms */
    tapTimeout?: number;
    /** Minimum distance for pan/swipe */
    threshold?: number;
    /** Enable pointer events */
    pointer?: boolean;
    /** Enable touch events */
    touch?: boolean;
    /** Enable mouse events */
    mouse?: boolean;
}

// Event Handlers
export type GestureEventHandler<T extends GestureEventData> = (event: T) => void;

// Gesture Actions
export interface GestureAction {
    (node: HTMLElement, options?: GestureOptions): {
    destroy?: () => void;
    update?: (options: GestureOptions) => void;
    };
}

// Main Exports
export const tap: GestureAction;
export const press: GestureAction;
export const pan: GestureAction;
export const swipe: GestureAction;
export const pinch: GestureAction;
export const rotate: GestureAction;
}

