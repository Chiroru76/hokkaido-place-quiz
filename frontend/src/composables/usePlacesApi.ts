/**
 * Google Places API (New) を使用して観光スポットを検索するcomposable
 */

/**
 * Places API のレスポンス型定義
 */
export interface PlaceResult {
  id: string;
  displayName: {
    text: string;
    languageCode?: string;
  };
  formattedAddress: string;
  rating?: number;
  userRatingCount?: number;
  photos?: Array<{
    name: string;
    widthPx?: number;
    heightPx?: number;
  }>;
}

/**
 * Places API Nearby Search のレスポンス型
 */
interface NearbySearchResponse {
  places: PlaceResult[];
}

/**
 * 市町村の中心座標
 */
interface MunicipalityCenter {
  lat: number;
  lng: number;
}

/**
 * GeoJSONデータのキャッシュ
 */
let geojsonCache: any = null;

/**
 * GeoJSONデータを読み込む
 */
async function loadGeoJson() {
  if (geojsonCache) {
    return geojsonCache;
  }

  try {
    const response = await fetch('/data/hokkaido.geojson');
    geojsonCache = await response.json();
    return geojsonCache;
  } catch (error) {
    console.error('Failed to load GeoJSON data:', error);
    return null;
  }
}

/**
 * 市町村名から中心座標を取得
 */
async function getMunicipalityCenterFromGeoJson(
  municipalityName: string
): Promise<MunicipalityCenter | null> {
  const data = await loadGeoJson();
  if (!data || !data.features) {
    return null;
  }

  // 市町村でフィルタリング
  const features = data.features.filter((feature: any) => {
    return feature.properties?.市町村名 === municipalityName;
  });

  if (features.length === 0) {
    return null;
  }

  // 境界ボックスを計算して中心座標を取得
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  features.forEach((feature: any) => {
    const geometry = feature.geometry;
    if (geometry?.type === 'Polygon' && geometry.coordinates?.[0]) {
      geometry.coordinates[0].forEach((coord: number[]) => {
        if (coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          const lng = coord[0];
          const lat = coord[1];
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        }
      });
    } else if (geometry?.type === 'MultiPolygon' && geometry.coordinates) {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon[0]?.forEach((coord: number[]) => {
          if (coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
            const lng = coord[0];
            const lat = coord[1];
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          }
        });
      });
    }
  });

  // 中心座標を計算
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  return {
    lat: centerLat,
    lng: centerLng,
  };
}

/**
 * Places API Nearby Search を呼び出して観光スポットを検索
 */
async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius: number = 20000
): Promise<PlaceResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key is not set');
    return [];
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos',
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: radius,
          },
        },
        includedTypes: ['tourist_attraction', 'point_of_interest'],
        maxResultCount: 5,
      }),
    });

    if (!response.ok) {
      console.error('Places API request failed:', response.statusText);
      return [];
    }

    const data: NearbySearchResponse = await response.json();
    return data.places || [];
  } catch (error) {
    console.error('Failed to fetch nearby places:', error);
    return [];
  }
}

/**
 * Places API を使用するcomposable
 */
export function usePlacesApi() {
  /**
   * 市町村名から観光スポットを検索
   */
  async function searchPlacesByMunicipality(municipalityName: string): Promise<PlaceResult[]> {
    // 市町村の中心座標を取得
    const center = await getMunicipalityCenterFromGeoJson(municipalityName);
    if (!center) {
      console.warn(`Municipality center not found: ${municipalityName}`);
      return [];
    }

    // Places API で観光スポットを検索
    const places = await fetchNearbyPlaces(center.lat, center.lng);
    return places;
  }

  /**
   * 写真URLを生成
   */
  function getPhotoUrl(photoName: string, maxWidth: number = 400): string {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
  }

  return {
    searchPlacesByMunicipality,
    getPhotoUrl,
  };
}
