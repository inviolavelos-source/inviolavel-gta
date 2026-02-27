export async function getGeolocation(): Promise<{ lat: string; lon: string } | undefined> {
    if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser.");
        return undefined;
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude.toString(),
                    lon: position.coords.longitude.toString(),
                });
            },
            (error) => {
                console.warn("Error getting location:", error.message);
                resolve(undefined);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    });
}
