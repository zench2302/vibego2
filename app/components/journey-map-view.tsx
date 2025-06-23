"use client"

import { useEffect, useState, memo } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { DAY_COLOR_SCHEMES } from './constants';

interface JourneyMapViewProps {
  itinerary: any;
  completedItems: Set<string>;
}

interface Pin {
  key: string;
  position: {
    lat: number;
    lng: number;
  };
  label: string;
  description: string;
  day: number;
}

const CustomPin = memo(({ day, color, arrowColor }: { day: number, color: string, arrowColor: string }) => (
  <div className="relative">
    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
      {day}
    </div>
    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 ${arrowColor}`}></div>
  </div>
));
CustomPin.displayName = 'CustomPin';

const MapController = ({ pins }: { pins: Pin[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || pins.length === 0) return;
    if (pins.length === 1) {
      map.setCenter(pins[0].position);
      map.setZoom(12);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    pins.forEach(pin => bounds.extend(pin.position));
    map.fitBounds(bounds, 100);
  }, [map, pins]);

  return null;
}

export default function JourneyMapView({ itinerary, completedItems }: JourneyMapViewProps) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredPinKey, setHoveredPinKey] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const geocodeLocations = async () => {
      if (!itinerary || !apiKey) return;
      setLoading(true);

      try {
        const destResponse = await fetch(`/api/geocode?address=${encodeURIComponent(itinerary.destination)}`);
        const destData = await destResponse.json();
        if (!destData.error && destData.geometry) {
          setCenter(destData.geometry.location);
        } else {
          console.error('Could not geocode destination:', destData.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error geocoding destination:', error);
      }

      const locationsToGeocode: { name: string, description: string, address: string, day: number }[] = [];
      itinerary.dailyItinerary.forEach((day: any) => {
        day.activities.forEach((act: any) => locationsToGeocode.push({ ...act, day: day.day }));
        day.restaurants.forEach((res: any) => locationsToGeocode.push({ ...res, day: day.day }));
      });
      
      const geocodedPins: Pin[] = [];
      for (const location of locationsToGeocode) {
        const pinId = `item-${location.day}-${locationsToGeocode.indexOf(location)}`;
        if (completedItems.has(pinId)) {
          continue; 
        }

        try {
          const response = await fetch(`/api/geocode?address=${encodeURIComponent(location.address)}`);
          const data = await response.json();
          if (!data.error && data.geometry) {
            geocodedPins.push({
              key: pinId,
              position: data.geometry.location,
              label: location.name,
              description: location.description,
              day: location.day,
            });
          } else {
            console.warn(`Could not geocode location ${location.name}: ${data.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`Error geocoding ${location.name}:`, error);
        }
      }

      setPins(geocodedPins);
      setLoading(false);
    };

    geocodeLocations();
  }, [itinerary, apiKey, completedItems]);

  if (!apiKey) return <div className="p-4 text-center">Error: API key missing.</div>;
  if (loading || !center) return <div className="h-[500px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const hoveredPin = pins.find(p => p.key === hoveredPinKey);

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ height: '500px', width: '100%' }}>
        <Map
          defaultCenter={center}
          defaultZoom={6}
          gestureHandling={'greedy'}
          mapId="VIBEGO_MAP"
          disableDefaultUI={true}
        >
          {pins.map((pin) => {
            const colorScheme = DAY_COLOR_SCHEMES[(pin.day - 1) % DAY_COLOR_SCHEMES.length];
            return (
              <AdvancedMarker
                key={pin.key}
                position={pin.position}
                onMouseEnter={() => setHoveredPinKey(pin.key)}
                onMouseLeave={() => setHoveredPinKey(null)}
              >
                <CustomPin day={pin.day} color={colorScheme.gradient} arrowColor={colorScheme.arrow} />
              </AdvancedMarker>
            );
          })}

          {hoveredPin && (
            <InfoWindow
              position={hoveredPin.position}
              pixelOffset={[0, -40]}
            >
              <div className="p-2 max-w-xs" onMouseEnter={() => setHoveredPinKey(hoveredPin.key)} onMouseLeave={() => setHoveredPinKey(null)}>
                <h3 className="font-bold text-base mb-1">{hoveredPin.label}</h3>
                <p className="text-sm text-gray-600">{hoveredPin.description}</p>
              </div>
            </InfoWindow>
          )}

          <MapController pins={pins} />
        </Map>
      </div>
    </APIProvider>
  );
} 