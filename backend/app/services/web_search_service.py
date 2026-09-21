from typing import Any

from tavily import TavilyClient

from app.config import settings


# ==========================================================
# Tavily client
# ==========================================================

def get_tavily_client() -> TavilyClient:
    """
    Create a Tavily client using the API key loaded through
    the application's Settings configuration.
    """

    if not settings.tavily_api_key:
        raise RuntimeError(
            "TAVILY_API_KEY is not configured."
        )

    return TavilyClient(
        api_key=settings.tavily_api_key
    )


# ==========================================================
# Web search
# ==========================================================

def search_web(
    query: str,
    max_results: int = 5,
) -> dict[str, Any]:
    """
    Search the public web and return normalized results.

    Only the search query is sent to Tavily. Private student
    academic context must never be included in the query.
    """

    clean_query = query.strip()

    if not clean_query:
        raise ValueError(
            "Search query cannot be empty."
        )

    max_results = max(
        1,
        min(max_results, 8),
    )

    client = get_tavily_client()

    response = client.search(
        query=clean_query,
        search_depth="basic",
        max_results=max_results,
        include_answer=False,
        include_raw_content=False,
        include_images=False,
    )

    normalized_results = []

    for result in response.get("results", []):
        title = (
            result.get("title") or ""
        ).strip()

        url = (
            result.get("url") or ""
        ).strip()

        content = (
            result.get("content") or ""
        ).strip()

        if not url:
            continue

        normalized_results.append(
            {
                "title": title,
                "url": url,
                "content": content,
                "score": result.get("score"),
            }
        )

    return {
        "query": clean_query,
        "results": normalized_results,
    }


# ==========================================================
# Availability
# ==========================================================

def web_search_available() -> bool:
    """
    Check whether Tavily web search is configured.
    """

    return bool(settings.tavily_api_key)