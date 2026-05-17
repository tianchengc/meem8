/**
 * Agent Tools Hub
 * 
 * Defines all executable external actions Gemma can take.
 * Crucially, these tools only receive the specific `query` string extracted
 * from the prompt, ensuring the private meeting transcript is never sent to the cloud.
 */

export async function executeWikipediaSearch(query: string): Promise<string> {
  console.log(`[Tool] Searching Wikipedia for: "${query}"`);
  
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.query && data.query.search && data.query.search.length > 0) {
      // Return top 2 results snippets
      const results = data.query.search.slice(0, 2).map((item: any) => {
        // Strip HTML tags from Wikipedia snippets
        const plainSnippet = item.snippet.replace(/<[^>]*>?/gm, '');
        return `Title: ${item.title}\nSummary: ${plainSnippet}`;
      }).join('\n\n');
      
      return results;
    }
    
    return `No Wikipedia results found for: ${query}`;
  } catch (error) {
    console.error("[Tool] Wikipedia search failed:", error);
    return `Failed to execute Wikipedia search for: ${query}`;
  }
}

// Registry map for dynamic execution routing
export const toolRegistry: Record<string, (query: string) => Promise<string>> = {
  "wikipedia_search": executeWikipediaSearch,
};
