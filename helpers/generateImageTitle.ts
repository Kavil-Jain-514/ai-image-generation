export function generateImageTitle(prompt: string): string {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "with",
    "and",
    "or",
    "of",
    "in",
    "on",
    "at",
    "for",
    "to",
    "from",
    "by",
    "is",
    "are",
    "this",
    "that",
  ]);

  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const topWords = Array.from(new Set(words)).slice(0, 4);

  if (topWords.length === 0) {
    return "AI Generated Image";
  }

  return topWords
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
