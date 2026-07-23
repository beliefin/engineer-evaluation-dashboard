export type RemoteWriteMode = "draft" | "final" | "immediate"

export type RemoteWriteRequest<TResult> = Readonly<{
  mode: RemoteWriteMode
  key?: string | undefined
  message?: string | undefined
  run: () => Promise<TResult>
}>

type RemoteWriteQueueOptions<TResult> = Readonly<{
  draftDelayMs: number
  onPendingChange?: (count: number) => void
  onSuccess?: (result: TResult, message: string | undefined, remaining: number) => void
  onError?: (error: unknown, remaining: number) => void
}>

type PendingDraft<TResult> = Readonly<{
  request: RemoteWriteRequest<TResult>
  timer: ReturnType<typeof setTimeout>
}>

export class RemoteWriteQueue<TResult> {
  private readonly options: RemoteWriteQueueOptions<TResult>
  private readonly drafts = new Map<string, PendingDraft<TResult>>()
  private readonly idleResolvers: Array<() => void> = []
  private chain: Promise<void> = Promise.resolve()
  private pending = 0

  constructor(options: RemoteWriteQueueOptions<TResult>) {
    this.options = options
  }

  get pendingCount(): number {
    return this.pending
  }

  enqueue(request: RemoteWriteRequest<TResult>): void {
    if (request.mode === "draft") {
      this.scheduleDraft(this.requireKey(request), request)
      return
    }
    if (request.mode === "final") {
      this.cancelDraft(this.requireKey(request))
    }
    this.enqueueImmediate(request)
  }

  whenIdle(): Promise<void> {
    if (this.pending === 0) return Promise.resolve()
    return new Promise((resolve) => {
      this.idleResolvers.push(resolve)
    })
  }

  dispose(): void {
    for (const key of [...this.drafts.keys()]) this.cancelDraft(key)
  }

  private requireKey(request: RemoteWriteRequest<TResult>): string {
    if (request.key === undefined || request.key.length === 0) {
      throw new RangeError(`${request.mode} writes require a key`)
    }
    return request.key
  }

  private scheduleDraft(key: string, request: RemoteWriteRequest<TResult>): void {
    const existing = this.drafts.get(key)
    if (existing !== undefined) clearTimeout(existing.timer)
    else this.changePending(1)

    const timer = setTimeout(() => {
      this.drafts.delete(key)
      this.appendToChain(request)
    }, this.options.draftDelayMs)
    this.drafts.set(key, { request, timer })
  }

  private cancelDraft(key: string): void {
    const existing = this.drafts.get(key)
    if (existing === undefined) return
    clearTimeout(existing.timer)
    this.drafts.delete(key)
    this.changePending(-1)
  }

  private enqueueImmediate(request: RemoteWriteRequest<TResult>): void {
    this.changePending(1)
    this.appendToChain(request)
  }

  private appendToChain(request: RemoteWriteRequest<TResult>): void {
    this.chain = this.chain.then(async () => {
      try {
        const result = await request.run()
        const remaining = this.changePending(-1)
        this.options.onSuccess?.(result, request.message, remaining)
      } catch (error) {
        const remaining = this.changePending(-1)
        this.options.onError?.(error, remaining)
      }
    })
  }

  private changePending(delta: number): number {
    this.pending += delta
    this.options.onPendingChange?.(this.pending)
    if (this.pending === 0) {
      const resolvers = this.idleResolvers.splice(0)
      resolvers.forEach((resolve) => resolve())
    }
    return this.pending
  }
}
