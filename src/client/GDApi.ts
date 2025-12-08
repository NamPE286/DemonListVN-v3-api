import GD from "new-gd.js";

let gdapiInstance: GD | null = null;

export const gdapi = new Proxy({} as GD, {
    get(target, prop) {
        if (!gdapiInstance) {
            gdapiInstance = new GD();
        }
        return (gdapiInstance as any)[prop];
    }
});