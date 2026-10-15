"use client"

import { useEffect, useId, useRef, useState, type ComponentProps } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import styles from "./horizontal-scroll.module.css"

type HorizontalScrollProps = Omit<ComponentProps<"div">, "ref"> & {
  "aria-label": string
}

type ScrollPosition = { overflowing: boolean; atStart: boolean; atEnd: boolean }
const INITIAL_POSITION: ScrollPosition = { overflowing: false, atStart: true, atEnd: true }

/** Visible guidance for an existing horizontal viewport. Content, axes and table
 *  semantics stay unchanged; only this viewport handles navigation keys. */
export function HorizontalScroll({ children, id, className, onKeyDown, onScroll, tabIndex = 0, "aria-describedby": describedBy, ...props }: HorizontalScrollProps) {
  const generatedId = useId()
  const viewportId = id ?? `horizontal-scroll-${generatedId}`
  const helpId = `${viewportId}-help`
  const viewportRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(INITIAL_POSITION)

  function measure() {
    const viewport = viewportRef.current
    if (!viewport) return
    const overflow = getComputedStyle(viewport).overflowX || getComputedStyle(viewport).overflow
    const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
    const overflowing = viewport.clientWidth > 0 && maximum > 1 && /auto|scroll|overlay/.test(overflow)
    const next = { overflowing, atStart: viewport.scrollLeft <= 1, atEnd: viewport.scrollLeft >= maximum - 1 }
    setPosition((previous) => previous.overflowing === next.overflowing && previous.atStart === next.atStart && previous.atEnd === next.atEnd ? previous : next)
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure)
    function observeContent() {
      resize?.disconnect()
      resize?.observe(viewport!)
      for (const child of viewport!.children) resize?.observe(child)
      measure()
    }
    const mutation = new MutationObserver(observeContent)
    mutation.observe(viewport, { childList: true, subtree: true, characterData: true })
    window.addEventListener("resize", measure)
    observeContent()
    return () => { resize?.disconnect(); mutation.disconnect(); window.removeEventListener("resize", measure) }
  }, [])

  function move(direction: -1 | 1) {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({ left: direction * Math.max(44, viewport.clientWidth * .75), behavior: "instant" })
    measure()
  }

  return (
    <>
      {position.overflowing ? (
        <p className={styles.controls} data-horizontal-scroll-controls="true">
          <span id={helpId} className={styles.description}>
            <strong>좌우로 더 보기</strong>
            <span>{position.atEnd ? "오른쪽 끝" : position.atStart ? "오른쪽 내용 있음" : "양쪽 내용 있음"}</span>
            <span className="sr-only">영역에 초점을 둔 뒤 좌우 방향키, Home, End 키로 이동할 수 있습니다.</span>
          </span>
          <span className={styles.buttons}>
            <button type="button" aria-label={`${props["aria-label"]} 왼쪽으로 이동`} aria-controls={viewportId} disabled={position.atStart} onClick={() => move(-1)}><ArrowLeft aria-hidden="true" size={20} /></button>
            <button type="button" aria-label={`${props["aria-label"]} 오른쪽으로 이동`} aria-controls={viewportId} disabled={position.atEnd} onClick={() => move(1)}><ArrowRight aria-hidden="true" size={20} /></button>
          </span>
        </p>
      ) : null}
      <div
        {...props}
        id={viewportId}
        ref={viewportRef}
        className={`${className ?? ""} ${styles.viewport}`}
        role={props.role ?? "region"}
        tabIndex={tabIndex}
        aria-describedby={[describedBy, position.overflowing ? helpId : undefined].filter(Boolean).join(" ") || undefined}
        onScroll={(event) => { measure(); onScroll?.(event) }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || event.target !== event.currentTarget || !position.overflowing || event.altKey || event.ctrlKey || event.metaKey) return
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1) }
          else if (event.key === "Home" || event.key === "End") {
            event.preventDefault()
            event.currentTarget.scrollTo({ left: event.key === "Home" ? 0 : event.currentTarget.scrollWidth - event.currentTarget.clientWidth, behavior: "instant" })
            measure()
          }
        }}
      >{children}</div>
    </>
  )
}
