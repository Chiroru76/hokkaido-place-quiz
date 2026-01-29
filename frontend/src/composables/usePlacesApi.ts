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
  const features = data.features.filter((feature: any) =>
    feature.properties?.市町村名 === municipalityName
  );

  if (features.length === 0) {
    return null;
  }

  // Google Maps LatLngBounds を使用して境界を計算
  const bounds = new google.maps.LatLngBounds();

  features.forEach((feature: any) => {
    const geometry = feature.geometry;
    // Polygon と MultiPolygon の処理を統一
    const rings = geometry?.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry?.type === 'MultiPolygon'
      ? geometry.coordinates.map((polygon: number[][][]) => polygon[0])
      : [];

    rings.forEach((ring: number[][]) => {
      ring?.forEach((coord: number[]) => {
        if (coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          bounds.extend(new google.maps.LatLng(coord[1], coord[0]));
        }
      });
    });
  });

  // 中心座標を取得
  const center = bounds.getCenter();
  return {
    lat: center.lat(),
    lng: center.lng(),
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
