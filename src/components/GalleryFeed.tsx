"use client";

import { useCallback, useEffect, useState } from "react";
import { GallerySuspense } from "./GallerySuspense";
import { LoadingSpinner } from "./LoadingSpinner";

export const GalleryFeed = ({ ItemView, endpoint }: { ItemView: any; endpoint: string }) => {
  const [data, setData] = useState<any[]>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadNextBatch = useCallback(async () => {
    
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);

    const hasParams = endpoint.includes("?");
    const paramsMarker = hasParams ? "&" : "?";
    const url = `${endpoint}${paramsMarker}${cursor ? `cursor=${cursor}` : ""}`;

    try {
      const res = await fetch(url, {
        method: "GET",
      });
      if (!res.ok) throw new Error(res.statusText);

      const { data: newData, nextCursor } = await res.json();

      if (data) {
        const existingIds = new Set(data.map(item => item.id));
        const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
        
        setData((prevData) => [...prevData, ...uniqueNewData]);
      } else {
        setData(newData);
      }
      
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch (err: any) {
      setError(`Could not fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore, data, endpoint]);

  useEffect(() => {
    if (!data) {
      loadNextBatch();
    }
  }, []);

  const [filteredUniqueMedia, setFilteredUniqueMedia] = useState<any[]>([]);
  useEffect(() => {
    const newFilteredUniqueMedia = data?.filter((item) => item.metadata?.__typename === "ImageMetadata" || item.metadata?.__typename === "VideoMetadata") || [];
    setFilteredUniqueMedia(newFilteredUniqueMedia);
  }, [data]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const viewport = event.target as HTMLElement;
      const threshold = 800;

      if (viewport.scrollTop + viewport.clientHeight + threshold >= viewport.scrollHeight && !loading) {
        loadNextBatch();
      }
    };

    const viewport = document.querySelector("[data-overlayscrollbars-viewport]");

    if (viewport) {
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [loadNextBatch, loading]);

  if (error) {
    return (
      <div className="col-span-3 flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h3 className="text-lg font-semibold mb-2">Unable to load gallery</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (!data) return <GallerySuspense />;

  const list = filteredUniqueMedia.filter(Boolean).map((item) => <ItemView key={item.id} item={item} />);

  return (
    <div className="grid grid-cols-3 gap-2 pb-12">
      {list}
      {loading && (
        <div className="col-span-3 w-full h-12 flex justify-center items-center">
          <LoadingSpinner />
        </div>
      )}
      {!loading && !hasMore && data && data.length > 0 && (
        <div className="col-span-3 w-full h-12 flex justify-center items-center text-muted-foreground text-sm">
          No more content to load
        </div>
      )}
      {!loading && data && data.length === 0 && (
        <div className="col-span-3 flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
          <h3 className="text-lg font-semibold mb-2">No media found</h3>
          <p className="text-sm text-muted-foreground">This user hasn't shared any images or videos yet.</p>
        </div>
      )}
    </div>
  );
};
