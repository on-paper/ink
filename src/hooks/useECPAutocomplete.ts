import { fetchAutocomplete } from "@ecp.eth/sdk/indexer";
import { useEffect, useState } from "react";

type AutocompleteResult =
  | { type: "ens"; address: `0x${string}`; name: string; avatarUrl: string | null; url: string; value: `0x${string}` }
  | {
      type: "erc20";
      address: `0x${string}`;
      name: string;
      symbol: string;
      caip19: string;
      chainId: number;
      decimals: number;
      logoURI: string | null;
      value: string;
    }
  | {
      type: "farcaster";
      address: `0x${string}`;
      fid: number;
      fname: string;
      displayName?: string | null;
      username: string;
      pfpUrl?: string | null;
      url: string;
      value: `0x${string}`;
      connectedAddress?: `0x${string}`;
    };

export function useECPAutocomplete(query: string | null, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query || !enabled || query.length === 0) {
      setResults([]);
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAutocomplete({
          query,
          char: "@",
          signal: abortController.signal,
        });

        if (!cancelled) {
          setResults(response.results);
        }
      } catch (err) {
        if (!cancelled && err instanceof Error && err.name !== "AbortError") {
          setError(err);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [query, enabled]);

  return { results, loading, error };
}
