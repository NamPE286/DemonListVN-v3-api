import provinces from '@static/provinces.json'

export class ProvincesService {
    getProvinces() {
        return provinces
    }
}

export default new ProvincesService()
