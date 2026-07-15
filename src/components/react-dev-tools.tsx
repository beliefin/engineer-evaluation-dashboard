"use client"

import { useEffect } from "react"

export function ReactDevTools() {
  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_ENABLE_REACT_DEVTOOLS === "1"

    if (!enabled) {
      return
    }

    void Promise.all([import("react-grab"), import("react-scan")]).then(
      ([grabModule, scanModule]) => {
        grabModule.init()
        scanModule.scan({ enabled: true })
      },
    )
  }, [])

  return null
}
