const aliases: Record<string, string> = {
  agent: 'agent', 智能体: 'agent',
  ai: 'ai', 人工智能: 'ai',
  engineering: 'engineering', 工程实践: 'engineering', 工程化: 'engineering', 前端工程: 'engineering',
  security: 'security', 安全: 'security',
};
export const topicSlugFor = (value: string) => aliases[value.trim().toLowerCase()];
