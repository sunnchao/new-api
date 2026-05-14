import { useState, useEffect, useRef } from 'react'

export function useMinimumLoadingTime(
  loading: boolean,
  minimumTime = 1000
): boolean {
  const [showSkeleton, setShowSkeleton] = useState(loading)
  const loadingStartRef = useRef(Date.now())

  useEffect(() => {
    if (loading) {
      loadingStartRef.current = Date.now()
      setShowSkeleton(true)
    } else {
      const elapsed = Date.now() - loadingStartRef.current
      const remaining = Math.max(0, minimumTime - elapsed)

      if (remaining === 0) {
        setShowSkeleton(false)
      } else {
        const timer = setTimeout(() => setShowSkeleton(false), remaining)
        return () => clearTimeout(timer)
      }
    }
  }, [loading, minimumTime])

  return showSkeleton
}
