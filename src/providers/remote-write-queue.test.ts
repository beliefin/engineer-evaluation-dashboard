import { afterEach, describe, expect, it, vi } from "vitest"

import { RemoteWriteQueue } from "./remote-write-queue"

afterEach(() => {
  vi.useRealTimers()
})

describe("RemoteWriteQueue", () => {
  it("coalesces rapid drafts for one sheet and persists only the latest value", async () => {
    vi.useFakeTimers()
    const persisted: string[] = []
    const queue = new RemoteWriteQueue<string>({ draftDelayMs: 700 })

    queue.enqueue({
      mode: "draft",
      key: "sheet-1",
      run: async () => {
        persisted.push("first")
        return "first"
      },
    })
    queue.enqueue({
      mode: "draft",
      key: "sheet-1",
      run: async () => {
        persisted.push("latest")
        return "latest"
      },
    })

    expect(queue.pendingCount).toBe(1)
    await vi.advanceTimersByTimeAsync(700)
    await queue.whenIdle()

    expect(persisted).toEqual(["latest"])
    expect(queue.pendingCount).toBe(0)
  })

  it("cancels a pending draft when the same sheet is submitted", async () => {
    vi.useFakeTimers()
    const persisted: string[] = []
    const queue = new RemoteWriteQueue<string>({ draftDelayMs: 700 })

    queue.enqueue({
      mode: "draft",
      key: "sheet-1",
      run: async () => {
        persisted.push("draft")
        return "draft"
      },
    })
    queue.enqueue({
      mode: "final",
      key: "sheet-1",
      run: async () => {
        persisted.push("submitted")
        return "submitted"
      },
    })

    await queue.whenIdle()
    await vi.advanceTimersByTimeAsync(700)

    expect(persisted).toEqual(["submitted"])
    expect(queue.pendingCount).toBe(0)
  })

  it("keeps accurate pending counts and continues after a failed write", async () => {
    const pendingCounts: number[] = []
    const errors: string[] = []
    const successes: string[] = []
    const queue = new RemoteWriteQueue<string>({
      draftDelayMs: 700,
      onPendingChange: (count) => pendingCounts.push(count),
      onError: (error) => errors.push(error instanceof Error ? error.message : "unknown"),
      onSuccess: (result) => successes.push(result),
    })

    queue.enqueue({
      mode: "immediate",
      run: async () => {
        throw new Error("network failed")
      },
    })
    queue.enqueue({
      mode: "immediate",
      run: async () => "saved",
    })

    await queue.whenIdle()

    expect(errors).toEqual(["network failed"])
    expect(successes).toEqual(["saved"])
    expect(pendingCounts).toEqual([1, 2, 1, 0])
    expect(queue.pendingCount).toBe(0)
  })

  it("persists the latest draft for six independent evaluator sheets at once", async () => {
    vi.useFakeTimers()
    const persisted = new Map<string, string>()
    const queues = Array.from({ length: 6 }, () => new RemoteWriteQueue<string>({ draftDelayMs: 700 }))

    queues.forEach((queue, index) => {
      const key = `sheet-${index + 1}`
      queue.enqueue({
        mode: "draft",
        key,
        run: async () => {
          persisted.set(key, "initial")
          return "initial"
        },
      })
      queue.enqueue({
        mode: "draft",
        key,
        run: async () => {
          persisted.set(key, "latest")
          return "latest"
        },
      })
    })

    expect(queues.map((queue) => queue.pendingCount)).toEqual([1, 1, 1, 1, 1, 1])
    await vi.advanceTimersByTimeAsync(700)
    await Promise.all(queues.map((queue) => queue.whenIdle()))

    expect([...persisted.entries()]).toEqual([
      ["sheet-1", "latest"],
      ["sheet-2", "latest"],
      ["sheet-3", "latest"],
      ["sheet-4", "latest"],
      ["sheet-5", "latest"],
      ["sheet-6", "latest"],
    ])
    expect(queues.every((queue) => queue.pendingCount === 0)).toBe(true)
  })
})
