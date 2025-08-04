declare module 'fflate' {
  export function gunzipSync(data: Uint8Array): Uint8Array;
  export function gzipSync(data: Uint8Array): Uint8Array;
  export function inflateSync(data: Uint8Array): Uint8Array;
  export function deflateSync(data: Uint8Array): Uint8Array;
} 