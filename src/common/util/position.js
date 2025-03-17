export const parseCoordinate = (coordinate) => {
    return parseFloat(coordinate.toFixed(6));
}

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
}

export const decimateCoordinates = (data, minDistance = 10) => {
    // Input validation
    if (!Array.isArray(data)) return [];
    if (data.length === 0) return [];
    if (typeof minDistance !== 'number' || minDistance <= 0) minDistance = 10;

    const result = [data[0]];

    // Use a temporary variable to store the last point
    let lastPoint = data[0];

    for (let i = 1; i < data.length; i++) {
        const currentPoint = data[i];

        let { latitude: prevLat, longitude:prevLng } = lastPoint;
        let { latitude: currLat, longitude:currLng } = currentPoint;

        // parseCoordinates
        prevLat = parseCoordinate(prevLat);
        prevLng = parseCoordinate(prevLng);
        currLat = parseCoordinate(currLat);
        currLng = parseCoordinate(currLng);

        // Skip invalid coordinates
        if (typeof prevLat !== 'number' ||
            typeof prevLng !== 'number' ||
            typeof currLat !== 'number' ||
            typeof currLng !== 'number') continue;

        const distance = calculateDistance(
            prevLat,
            prevLng,
            currLat,
            currLng
        );

        if (distance > minDistance) {
            result.push(currentPoint);
            lastPoint = currentPoint;
        }
    }

    return [...result];
}

export const calculateDistanceFromCoords = (coords) => {
    return coords.reduce((prev, coord, i) => {
        if(coords[i - 1] === undefined) return prev;
        const lastCoord = coords[i - 1] || [];

        const longitude = parseCoordinate(Number(coord.longitude));
        const latitude = parseCoordinate(Number(coord.latitude));
        const PrevLongitude = parseCoordinate(Number(lastCoord.longitude));
        const PrevLatitude = parseCoordinate(Number(lastCoord.latitude));

        const distance = calculateDistance(latitude, longitude, PrevLatitude, PrevLongitude);

        return parseFloat(Number(distance + prev).toFixed(2));
    }, 0);
}