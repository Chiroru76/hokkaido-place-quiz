/**
 * Routes API の型定義
 * Google Routes API (Compute Routes) のレスポンスと表示用データの型
 */

/**
 * 移動手段
 */
export type TravelMode = 'DRIVE' | 'TRANSIT';

/**
 * 座標情報
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * 地点情報（出発地・目的地）
 */
export interface Waypoint {
  location: {
    latLng: LatLng;
  };
}

/**
 * Routes API のリクエストボディ
 */
export interface ComputeRoutesRequest {
  origin: Waypoint;
  destination: Waypoint;
  travelMode: TravelMode;
  routingPreference?: 'TRAFFIC_AWARE' | 'TRAFFIC_UNAWARE';
  computeAlternativeRoutes?: boolean;
  languageCode?: string;
  units?: 'METRIC' | 'IMPERIAL';
}

/**
 * Routes API のレスポンス（routes 配列のみ）
 */
export interface ComputeRoutesResponse {
  routes: Route[];
}

/**
 * ルート情報
 */
export interface Route {
  /**
   * 所要時間（例: "12345s" = 12345秒）
   */
  duration: string;

  /**
   * 距離（メートル）
   */
  distanceMeters: number;
}

/**
 * 表示用のルート情報（整形済み）
 */
export interface RouteInfo {
  /**
   * 移動手段
   */
  travelMode: TravelMode;

  /**
   * 所要時間（整形済み、例: "3時間20分"）
   */
  formattedDuration: string;

  /**
   * 距離（整形済み、例: "250.5km"）
   */
  formattedDistance: string;

  /**
   * 所要時間（秒）
   */
  durationSeconds: number;

  /**
   * 距離（メートル）
   */
  distanceMeters: number;
}

/**
 * キャッシュ用のデータ構造
 */
export interface CachedRouteData {
  /**
   * キャッシュした日時（ISO 8601形式）
   */
  cachedAt: string;

  /**
   * 出発地の座標
   */
  origin: LatLng;

  /**
   * 目的地の座標
   */
  destination: LatLng;

  /**
   * 車のルート情報
   */
  drive: RouteInfo | null;

  /**
   * 公共交通機関のルート情報
   */
  transit: RouteInfo | null;
}

/**
 * 東京駅の座標（出発地として使用）
 */
export const TOKYO_STATION: LatLng = {
  latitude: 35.681236,
  longitude: 139.767125,
};
