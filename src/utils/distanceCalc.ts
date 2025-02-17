export const calculateDistance = (
    userLat: number,
    userLon: number,
    venueLat: number,
    venueLon: number
  ): number => {
    const deg_to_m = 111000;
  
    const latDiff = (venueLat - userLat) * deg_to_m;
    const lonDiff = (venueLon - userLon) * deg_to_m * Math.cos((userLat * Math.PI) / 180);
  
    const distance = Math.sqrt(latDiff ** 2 + lonDiff ** 2);
  
    return Math.round(distance);
  };
  