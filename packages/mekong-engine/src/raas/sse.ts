export type SSEStream = {
  readable: ReadableStream
  send: (event: string, data: unknown) => void
  close: () => void
}

function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export function createSSEStream(): SSEStream {
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null
  const encoder = new TextEncoder()

  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
    cancel() {
      controller = null
    },
  })

  function send(event: string, data: unknown): void {
    if (!controller) return
    controller.enqueue(encoder.encode(formatSSE(event, data)))
  }

  function close(): void {
    if (!controller) return
    controller.close()
    controller = null
  }

  return { readable, send, close }
}
