/** Historical event records are web pages, not current public ticket offers. */
export function getEventPageSchema(event: Record<string, unknown>, archived: boolean, locale: string) {
  if (!archived) return { ...event, inLanguage: locale };
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: event.name,
    description: event.description,
    url: event.url,
    image: event.image,
    inLanguage: locale,
    ...(event.sameAs ? { relatedLink: event.sameAs } : {}),
  };
}
