import Handlebars from 'handlebars';
interface RenderContext {
    [key: string]: any;
}
export declare function render(template: string, context?: RenderContext, layout?: string): Promise<string>;
export declare function clearCache(): void;
export declare function registerHelper(name: string, helper: Handlebars.HelperDelegate): void;
export declare function setCaching(enabled: boolean): void;
export declare function setCacheTTL(ttl: number): void;
export declare function initHandlebars(): Promise<void>;
export {};
