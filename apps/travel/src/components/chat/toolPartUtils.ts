import type { UIMessage } from 'ai';

export interface NormalizedToolPart {
  toolName: string;
  state: string;
  output: unknown;
}

export function normalizeToolPart(part: UIMessage['parts'][number]): NormalizedToolPart | null {
  if (part.type === 'dynamic-tool') {
    const dynamicPart = part as { toolName?: string; state?: string; output?: unknown };
    return {
      toolName: dynamicPart.toolName ?? '',
      state: dynamicPart.state ?? '',
      output: dynamicPart.output,
    };
  }

  if (!part.type.startsWith('tool-')) {
    return null;
  }

  const toolPart = part as { state?: string; output?: unknown };
  return {
    toolName: part.type.slice(5),
    state: toolPart.state ?? '',
    output: toolPart.output,
  };
}
