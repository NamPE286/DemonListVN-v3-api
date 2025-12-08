import GD from "new-gd.js";

let gdapiInstance: GD | null = null;

function getGDApi(): GD {
    if (!gdapiInstance) {
        gdapiInstance = new GD();
    }
    return gdapiInstance;
}

export const gdapi = {
    get levels() {
        return getGDApi().levels;
    }
};