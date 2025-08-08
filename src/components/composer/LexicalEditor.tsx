"use client";

import { CodeNode } from "@lexical/code";
import { $isAutoLinkNode, $isLinkNode, AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  ELEMENT_TRANSFORMERS,
  LINK,
  TEXT_FORMAT_TRANSFORMERS,
  type TextMatchTransformer,
  type Transformer,
} from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { COMMAND_PRIORITY_LOW, KEY_DOWN_COMMAND, PASTE_COMMAND } from "lexical";
import { AnchorPointPlugin, createAnchorPoint, DEFAULT_URL_REGEX } from "lexical-anchorpoint";
import { useCallback, useEffect, useRef } from "react";
import "./lexical.css";
import { EmojiTypeaheadPlugin } from "./EmojiTypeaheadPlugin";
import { FloatingToolbarPlugin } from "./FloatingToolbarPlugin";
import { MentionsTypeaheadPlugin } from "./MentionsTypeaheadPlugin";

const CUSTOM_AUTOLINK: TextMatchTransformer = {
  ...LINK,
  export: (node, exportChildren) => {
    if (!$isLinkNode(node)) {
      return null;
    }

    // For AutoLinkNodes, just return the URL as-is
    if ($isAutoLinkNode(node)) {
      return node.getURL();
    }

    const title = node.getTitle();
    const textContent = exportChildren(node);
    const linkContent = title ? `[${textContent}](${node.getURL()} "${title}")` : `[${textContent}](${node.getURL()})`;
    return linkContent;
  },
};

const CUSTOM_TRANSFORMERS: Array<Transformer> = [...ELEMENT_TRANSFORMERS, ...TEXT_FORMAT_TRANSFORMERS, CUSTOM_AUTOLINK];

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (event: KeyboardEvent) => void;
  onPasteFiles?: (files: File[]) => void;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
}

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  paragraph: "lexical-paragraph",
  quote: "lexical-quote",
  heading: {
    h1: "lexical-h1",
    h2: "lexical-h2",
    h3: "lexical-h3",
    h4: "lexical-h4",
    h5: "lexical-h5",
    h6: "lexical-h6",
  },
  list: {
    nested: {
      listitem: "lexical-nested-listitem",
    },
    ol: "lexical-list-ol",
    ul: "lexical-list-ul",
    listitem: "lexical-listitem",
  },
  link: "lexical-link",
  text: {
    bold: "lexical-text-bold",
    italic: "lexical-text-italic",
    strikethrough: "lexical-text-strikethrough",
    underline: "lexical-text-underline",
    code: "lexical-text-code",
  },
  code: "lexical-code",
  codeHighlight: {
    atrule: "lexical-code-atrule",
    attr: "lexical-code-attr",
    boolean: "lexical-code-boolean",
    builtin: "lexical-code-builtin",
    cdata: "lexical-code-cdata",
    char: "lexical-code-char",
    class: "lexical-code-class",
    comment: "lexical-code-comment",
    constant: "lexical-code-constant",
    deleted: "lexical-code-deleted",
    doctype: "lexical-code-doctype",
    entity: "lexical-code-entity",
    function: "lexical-code-function",
    important: "lexical-code-important",
    inserted: "lexical-code-inserted",
    keyword: "lexical-code-keyword",
    namespace: "lexical-code-namespace",
    number: "lexical-code-number",
    operator: "lexical-code-operator",
    prolog: "lexical-code-prolog",
    property: "lexical-code-property",
    punctuation: "lexical-code-punctuation",
    regex: "lexical-code-regex",
    selector: "lexical-code-selector",
    string: "lexical-code-string",
    symbol: "lexical-code-symbol",
    tag: "lexical-code-tag",
    url: "lexical-code-url",
    variable: "lexical-code-variable",
  },
};

function onError(error: Error) {
  console.error(error);
}

const PlaceholderPlugin = ({ placeholder }: { placeholder: string }) => {
  return <div className="lexical-placeholder">{placeholder}</div>;
};

const KeyboardShortcutPlugin = ({ onKeyDown }: { onKeyDown?: (event: KeyboardEvent) => void }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          if (onKeyDown) {
            onKeyDown(event);
          }
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onKeyDown]);

  return null;
};

const PastePlugin = ({ onPasteFiles }: { onPasteFiles?: (files: File[]) => void }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items || !onPasteFiles) return false;

        const files: File[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Check if the item is an image or video
          if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
            const file = item.getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }

        if (files.length > 0) {
          event.preventDefault();
          onPasteFiles(files);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onPasteFiles]);

  return null;
};

const OnChangePluginWrapper = ({ onChange, value }: { onChange: (value: string) => void; value: string }) => {
  const [editor] = useLexicalComposerContext();
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (value !== lastValueRef.current && value !== undefined) {
      editor.update(() => {
        $convertFromMarkdownString(value, CUSTOM_TRANSFORMERS);
      });
      lastValueRef.current = value;
    }
  }, [value, editor]);

  const handleChange = useCallback(() => {
    editor.update(() => {
      const markdown = $convertToMarkdownString(CUSTOM_TRANSFORMERS);
      if (markdown !== lastValueRef.current) {
        lastValueRef.current = markdown;
        onChange(markdown);
      }
    });
  }, [editor, onChange]);

  return <OnChangePlugin onChange={handleChange} />;
};

function EditorContent({
  value,
  onChange,
  placeholder = "write a new post...",
  disabled = false,
  onKeyDown,
  onPasteFiles,
  className = "",
  onFocusChange,
}: LexicalEditorProps) {
  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={`lexical-editor ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
            data-lexical-editor
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
        placeholder={<PlaceholderPlugin placeholder={placeholder} />}
      />
      <OnChangePluginWrapper onChange={onChange} value={value} />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <MarkdownShortcutPlugin transformers={CUSTOM_TRANSFORMERS} />
      <KeyboardShortcutPlugin onKeyDown={onKeyDown} />
      <PastePlugin onPasteFiles={onPasteFiles} />
      <EmojiTypeaheadPlugin />
      <MentionsTypeaheadPlugin />
      <FloatingToolbarPlugin />
      <AnchorPointPlugin
        points={[
          createAnchorPoint(DEFAULT_URL_REGEX, (text) => {
            if (!text.startsWith("http://") && !text.startsWith("https://") && !text.startsWith("ftp://")) {
              return `https://${text}`;
            }
            return text;
          }),
        ]}
      />
    </>
  );
}

export const LexicalEditorWrapper = ({
  value,
  onChange,
  placeholder = "write a new post...",
  disabled = false,
  onKeyDown,
  onPasteFiles,
  className = "",
  onFocusChange,
}: LexicalEditorProps) => {
  const initialConfig = {
    namespace: "PostComposer",
    theme,
    onError,
    nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, LinkNode, AutoLinkNode],
    editorState: () => {
      if (value) {
        $convertFromMarkdownString(value, CUSTOM_TRANSFORMERS);
      }
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorContent
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onPasteFiles={onPasteFiles}
        className={className}
        onFocusChange={onFocusChange}
      />
    </LexicalComposer>
  );
};
