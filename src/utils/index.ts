export function isActive(expiryDate: string | null) {
    if (!expiryDate) {
        return false;
    }

    return new Date(expiryDate) > new Date();
}
