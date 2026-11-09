/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useMemo, useState } from 'react'

import { splitCountdown, type CountdownParts } from '../lib/campaign'

/**
 * Ticks once per second toward a Unix timestamp, correcting for the offset
 * between the visitor's clock and the server clock reported with the campaign.
 */
export function useCountdown(
  targetUnix: number,
  serverTimeUnix: number
): CountdownParts {
  // Fixed at render of a given server_time; recomputing it every render would
  // count the elapsed time twice.
  const offsetMs = useMemo(
    () => serverTimeUnix * 1000 - Date.now(),
    [serverTimeUnix]
  )
  const [remainingMs, setRemainingMs] = useState(
    () => targetUnix * 1000 - (Date.now() + offsetMs)
  )

  useEffect(() => {
    const tick = () => {
      setRemainingMs(targetUnix * 1000 - (Date.now() + offsetMs))
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [targetUnix, offsetMs])

  return splitCountdown(remainingMs)
}
