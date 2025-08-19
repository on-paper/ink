"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalTypeaheadMenuPlugin, MenuOption } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $getSelection, $isRangeSelection, TextNode } from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { useECPAutocomplete } from "~/hooks/useECPAutocomplete";
import { MentionMenuItem, MentionOption } from "./MentionOption";

const MAX_MENTION_SUGGESTIONS = 10;

function useMentionLookup() {
  const [queryString, setQueryString] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState<string | null>(null);

  // Debounce the query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queryString);
    }, 300);

    return () => clearTimeout(timer);
  }, [queryString]);

  const { results, loading } = useECPAutocomplete(debouncedQuery && debouncedQuery.length > 0 ? debouncedQuery : null);

  const options = useMemo(() => {
    if (!results || loading) {
      return [];
    }

    const limitedResults = results.slice(0, MAX_MENTION_SUGGESTIONS);

    return limitedResults
      .map((result) => {
        if (result.type === "ens") {
          return new MentionOption({
            id: result.address,
            username: result.name,
            address: result.address,
            profilePictureUrl: result.avatarUrl || undefined,
            name: result.name,
            namespace: "ens",
          });
        }
        // Skip non-ENS results
        return null;
      })
      .filter((option): option is MentionOption => option !== null);
  }, [results, loading]);

  const onSelectOption = useCallback(
    (selectedOption: MenuOption, nodeToRemove: TextNode | null, closeMenu: () => void) => {
      const editor = (window as any).lexicalEditor;
      if (!editor || !nodeToRemove) return;

      editor.update(() => {
        const mentionOption = selectedOption as MentionOption;
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return;
        }

        nodeToRemove.remove();

        const username = mentionOption.user.username;
        selection.insertRawText(`@${username} `);
        closeMenu();
      });
    },
    [],
  );

  return {
    queryString,
    setQueryString,
    options,
    loading,
    onSelectOption,
    debouncedQuery,
  };
}

export function MentionsTypeaheadPlugin() {
  const [editor] = useLexicalComposerContext();
  const { setQueryString, options, loading, onSelectOption, debouncedQuery } = useMentionLookup();

  useEffect(() => {
    (window as any).lexicalEditor = editor;
    return () => {
      delete (window as any).lexicalEditor;
    };
  }, [editor]);

  const checkForTriggerMatch = useCallback((text: string) => {
    // Match @ followed by any word characters
    const match = text.match(/@(\w*)$/);
    if (match) {
      const query = match[1];
      return {
        leadOffset: match.index || 0,
        matchingString: query,
        replaceableString: match[0],
      };
    }
    return null;
  }, []);

  return (
    <LexicalTypeaheadMenuPlugin<MentionOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        if (!anchorElementRef.current) {
          return null;
        }

        if (!loading && options.length === 0 && !debouncedQuery) {
          return null;
        }

        const editorElement = editor.getRootElement();
        const editorContainer = editorElement?.closest(".lexical-editor");
        const containerRect = editorContainer?.getBoundingClientRect();
        const anchorRect = anchorElementRef.current.getBoundingClientRect();

        // Use editor container bottom if available, otherwise fall back to anchor
        const editorRect = editorElement?.getBoundingClientRect();
        const topPosition = editorRect ? editorRect.bottom : anchorRect.bottom - 12;

        const style: React.CSSProperties = {
          position: "fixed",
          top: topPosition,
          left: containerRect?.left || anchorRect.left,
          width: containerRect?.width || "auto",
        };

        return ReactDOM.createPortal(
          <div className="rounded-lg shadow-lg z-[100] bg-card/40 backdrop-blur-md border border-border" style={style}>
            <ul className="list-none m-0 p-0.5 flex flex-col gap-0.5">
              {loading && (
                <>
                  {/* Show skeleton items while loading */}
                  {[1, 2, 3].map((i) => (
                    <li key={`skeleton-${i}`} className="flex items-center gap-2 px-3 py-1.5 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-muted rounded mb-1" />
                      </div>
                    </li>
                  ))}
                </>
              )}
              {!loading && options.length === 0 && debouncedQuery && (
                <li className="px-3 py-1.5 text-sm text-muted-foreground text-center">No users found</li>
              )}
              {options.map((option, index) => (
                <MentionMenuItem
                  key={option.key}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => {
                    setHighlightedIndex(index);
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => {
                    setHighlightedIndex(index);
                  }}
                  option={option}
                />
              ))}
            </ul>
          </div>,
          document.body,
        );
      }}
    />
  );
}
