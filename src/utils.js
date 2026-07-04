// Fonction utilitaire pour convertir le format Hexadécimal PostGIS (WKB) en Lat/Lng
export const parsePostGISCoordinates = (hexString) => {
  if (!hexString || typeof hexString !== 'string') return null;
  try {
    // On vérifie si c'est bien du hex
    if (!/^[0-9A-Fa-f]+$/.test(hexString)) return null;

    // Conversion hex -> bytes
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const view = new DataView(bytes.buffer);
    
    // Lecture du format WKB (Little Endian pour 01)
    const littleEndian = view.getUint8(0) === 1;
    const type = view.getUint32(1, littleEndian);
    
    // Décalage : 1 byte (endian) + 4 bytes (type) + 4 bytes (SRID si présent)
    // Le flag SRID est 0x20000000
    const offset = (type & 0x20000000) ? 9 : 5;
    
    const lng = view.getFloat64(offset, littleEndian);
    const lat = view.getFloat64(offset + 8, littleEndian);
    
    return { lat, lng };
  } catch (e) {
    console.error("Erreur parsing coordonnées:", e);
    return null;
  }
}