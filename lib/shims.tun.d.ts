import { TunRequest, TunContext } from 'tun'

declare module 'tun' {
  interface TunRequest {
    slugs: Record<string, string>
  }
}
