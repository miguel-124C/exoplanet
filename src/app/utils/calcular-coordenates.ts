// Tipo para representar un planeta con ra, dec y el eje semi-mayor
interface Planet {
    ra: number;    // Ascensión recta en decimal (en horas, minutos o grados decimales)
    dec: number;   // Declinación en decimal
    orbitSemiMajorAxis: number;  // Eje semi-mayor en AU
}
  
// Función para convertir de grados a radianes (en caso de ser necesario)
function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Función para convertir horas en ascensión recta a radianes
function hoursToRad(hours: number): number {
    return hours * (Math.PI / 12);  // 1 hora = 15 grados = π/12 radianes
}

// Función para obtener coordenadas cartesianas (x, y, z) de un planeta
export function getCartesianCoordinates(planet: Planet): { x: number, y: number, z: number } {
    // RA en horas convertido a radianes
    const raRad = hoursToRad(planet.ra); 
    // DEC en grados convertido a radianes
    const decRad = degToRad(planet.dec); 
    const r = planet.orbitSemiMajorAxis; // Eje semi-mayor en AU

    // Fórmulas de conversión esféricas a cartesianas
    const x = r * Math.cos(decRad) * Math.cos(raRad) * 10;
    const y = r * Math.cos(decRad) * Math.sin(raRad)* 10;
    const z = r * Math.sin(decRad) * 10;

    return { x, y, z };
}