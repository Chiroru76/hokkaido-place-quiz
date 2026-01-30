/**
 * Google Routes API を使用してルート情報を取得するcomposable
 */

import type {
  ComputeRoutesRequest,
  ComputeRoutesResponse,
  RouteInfo,
  TravelMode,
  LatLng,
  CachedRouteData,
} from '../types/routes';
import { TOKYO_STATION } from '../types/routes';

/**
 * Routes APIを呼び出してルート情報を取得
 */
async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  travelMode: TravelMode
): Promise<RouteInfo | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key is not set');
    return null;
  }

  const requestBody: ComputeRoutesRequest = {
    origin: {
      location: {
        latLng: origin,
      },
    },
    destination: {
      location: {
        latLng: destination,
      },
    },
    travelMode,
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: false,
    languageCode: 'ja',
    units: 'METRIC',
  };

  try {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Routes API request failed:', {
        status: response.status,
        statusText: response.statusText,
        travelMode,
        errorData,
      });
      return null;
    }

    const data: ComputeRoutesResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn(`No routes found for ${travelMode}`);
      return null;
    }

    const route = data.routes[0];

    // 秒数に変換（"12345s" → 12345）
    const durationSeconds = parseInt(route.duration.replace('s', ''));

    return {
      travelMode,
      formattedDuration: formatDuration(durationSeconds),
      formattedDistance: formatDistance(route.distanceMeters),
      durationSeconds,
      distanceMeters: route.distanceMeters,
    };
  } catch (error) {
    console.error(`Failed to fetch route for ${travelMode}:`, error);
    return null;
  }
}

/**
 * 秒数を「〇時間〇分」形式に変換
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}時間${minutes}分`;
  } else {
    return `${minutes}分`;
  }
}

/**
 * メートルを「〇〇km」形式に変換
 */
function formatDistance(meters: number): string {
  const km = (meters / 1000).toFixed(1);
  return `${km}km`;
}

/**
 * SessionStorageからキャッシュを取得
 */
function getCachedRoutes(destinationKey: string): CachedRouteData | null {
  try {
    const cacheKey = `routes_cache_${destinationKey}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Failed to get cached routes:', error);
  }
  return null;
}

/**
 * SessionStorageにキャッシュを保存
 */
function setCachedRoutes(destinationKey: string, data: CachedRouteData): void {
  try {
    const cacheKey = `routes_cache_${destinationKey}`;
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to set cached routes:', error);
  }
}

/**
 * 目的地の座標からキャッシュキーを生成
 */
function getDestinationKey(destination: LatLng): string {
  return `${destination.latitude.toFixed(6)}_${destination.longitude.toFixed(6)}`;
}

/**
 * Routes API を使用するcomposable
 */
export function useRoutesApi() {
  /**
   * 東京駅から目的地までのルート情報を取得（キャッシュ対応）
   * DRIVEとTRANSITの両方を並列で取得
   */
  async function fetchRoutesFromTokyo(destination: LatLng): Promise<RouteInfo[]> {
    const destinationKey = getDestinationKey(destination);

    // キャッシュをチェック
    const cached = getCachedRoutes(destinationKey);
    if (cached) {
      console.log(`Using cached routes for: ${destinationKey}`);
      const routes: RouteInfo[] = [];
      if (cached.drive) routes.push(cached.drive);
      if (cached.transit) routes.push(cached.transit);
      return routes;
    }

    // DRIVEとTRANSITを並列で取得
    const [driveRoute, transitRoute] = await Promise.all([
      fetchRoute(TOKYO_STATION, destination, 'DRIVE'),
      fetchRoute(TOKYO_STATION, destination, 'TRANSIT'),
    ]);

    // キャッシュに保存
    const cacheData: CachedRouteData = {
      cachedAt: new Date().toISOString(),
      origin: TOKYO_STATION,
      destination,
      drive: driveRoute,
      transit: transitRoute,
    };
    setCachedRoutes(destinationKey, cacheData);

    // 結果を配列にまとめる
    const routes: RouteInfo[] = [];
    if (driveRoute) routes.push(driveRoute);
    if (transitRoute) routes.push(transitRoute);

    return routes;
  }

  /**
   * Google Mapsのルート検索URLを生成
   */
  function getGoogleMapsRouteUrl(destination: LatLng): string {
    const originParam = `${TOKYO_STATION.latitude},${TOKYO_STATION.longitude}`;
    const destinationParam = `${destination.latitude},${destination.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}`;
  }

  return {
    fetchRoutesFromTokyo,
    getGoogleMapsRouteUrl,
  };
}
