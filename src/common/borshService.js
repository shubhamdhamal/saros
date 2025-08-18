/* eslint-disable no-undef */
import { HashService } from './hashService'

export class BorshService {
  static anchorSerialize (method, layout, data, maxSpan) {
    const prefix = HashService.sha256(`global:${method}`)
    const truncatedPrefix = prefix.slice(0, 8)
    const buffer = Buffer.alloc(maxSpan)
    const span = layout.encode(data, buffer)
    return Buffer.from([...truncatedPrefix, ...buffer.slice(0, span)])
  }

  static anchorDeserialize (layout, data) {
    return layout.decode(data.slice(8))
  }

  static deserialize (layout, data) {
    return layout.decode(data)
  }

  static serialize (layout, data, maxSpan) {
    // Validate maxSpan to prevent excessive memory allocation
    if (maxSpan <= 0 || maxSpan > 1024 * 1024) { // 1MB limit
      throw new Error('Invalid maxSpan: must be between 1 and 1MB');
    }
    
    // Use dynamic allocation for better memory efficiency
    const buffer = Buffer.allocUnsafe(maxSpan)
    const span = layout.encode(data, buffer)
    return buffer.slice(0, span)
  }
}
