export const fetchVenueData = async (venueSlug: string) => {
    const staticResponse = await fetch(
      `https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues/${venueSlug}/static`
    );
    const dynamicResponse = await fetch(
      `https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues/${venueSlug}/dynamic`
    );
  
    if (!staticResponse.ok || !dynamicResponse.ok) {
      throw new Error("Failed to fetch data");
    }
  
    const staticData = await staticResponse.json();
    const dynamicData = await dynamicResponse.json();
  
    return { staticData: staticData.venue_raw, dynamicData: dynamicData.venue_raw };
  };