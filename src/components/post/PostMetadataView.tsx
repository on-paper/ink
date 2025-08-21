import type {
  AudioMetadata,
  EmbedMetadata,
  EventMetadata,
  ImageMetadata,
  LinkMetadata,
  MarkdownMetadata,
  MediaData,
  PostMention,
  TokenData,
  VideoMetadata,
} from "@cartel-sh/ui";
import { AudioPlayer } from "../AudioPlayer";
import { LinkPreview } from "../embeds/LinkPreview";
import { ImageViewer } from "../ImageViewer";
import Markdown, { extractUrlsFromText } from "../Markdown";
import { Badge } from "../ui/badge";
import { VideoPlayer } from "../VideoPlayer";

export const getPostContent = (
  metadata: MarkdownMetadata,
  mentions?: PostMention[],
  showLinkPreviews = false,
): React.ReactNode => {
  return (
    <ContentView
      content={metadata?.content}
      mentions={mentions}
      showLinkPreviews={showLinkPreviews}
      mediaData={metadata?.mediaData}
      tokenData={metadata?.tokenData}
    />
  );
};

export const getPostLinkPreviews = (metadata: MarkdownMetadata): string[] => {
  return extractUrlsFromText(metadata?.content);
};

const ContentView = ({
  content,
  mentions,
  showLinkPreviews = false,
  mediaData,
  tokenData,
}: {
  content: string;
  mentions?: PostMention[];
  showLinkPreviews?: boolean;
  mediaData?: MediaData;
  tokenData?: TokenData;
}) => {
  return (
    <Markdown
      content={content}
      mentions={mentions}
      showLinkPreviews={showLinkPreviews}
      mediaData={mediaData}
      tokenData={tokenData}
    />
  );
};

export const ImageView = ({ metadata, mentions }: { metadata: ImageMetadata; mentions?: PostMention[] }) => {
  const url = metadata?.image?.item;
  const alt = metadata?.image.altTag;

  if (!url) return null;

  return (
    <div>
      {metadata.content && <ContentView content={metadata.content} mentions={mentions} />}
      <div className="relative mt-2">
        <ImageViewer src={url} alt={alt} className="object-contain border rounded-xl max-h-[300px] w-auto" />
      </div>
    </div>
  );
};

export const VideoView = ({ metadata, mentions }: { metadata: VideoMetadata; mentions?: PostMention[] }) => {
  const url = metadata?.video?.item;
  const cover = metadata?.video?.cover || undefined;

  if (!url) return null;

  return (
    <div>
      {metadata.content && <ContentView content={metadata.content} mentions={mentions} />}
      <div className="mt-2" style={{ maxHeight: "min(100%, 300px)" }}>
        <VideoPlayer url={url!} preview={cover!} autoplay={true} />
      </div>
    </div>
  );
};

export const AudioView = ({ metadata, mentions }: { metadata: AudioMetadata; mentions?: PostMention[] }) => {
  const url = metadata?.audio?.item;
  const cover = metadata?.audio.cover;
  const artist = metadata?.audio.artist;
  const title = metadata?.audio.title;

  if (!url) return null;

  return (
    <div>
      {metadata.content && <ContentView content={metadata.content} mentions={mentions} />}
      <AudioPlayer url={url!} cover={cover!} author={artist!} title={title!} />
    </div>
  );
};

export const LinkView = ({ metadata, mentions }: { metadata: LinkMetadata; mentions?: PostMention[] }) => {
  const contentContainsLink = metadata.content?.includes(metadata.sharingLink) || false;

  return (
    <div>
      {metadata.content && <ContentView content={metadata.content} mentions={mentions} />}
      {!contentContainsLink && (
        <div className="mt-4">
          <LinkPreview url={metadata.sharingLink} />
        </div>
      )}
    </div>
  );
};

export const EmbedView = ({ metadata, mentions }: { metadata: EmbedMetadata; mentions?: PostMention[] }) => {
  return (
    <div>
      {metadata.content && <ContentView content={metadata.content} mentions={mentions} />}
      {metadata.embed && (
        <div className="mt-4">
          <LinkPreview url={metadata.embed} />
        </div>
      )}
    </div>
  );
};

export const EventView = ({ metadata, mentions }: { metadata: EventMetadata; mentions?: PostMention[] }) => {
  return (
    <div>
      {metadata.content && <ContentView content={metadata.content} mentions={mentions} />}
      <div className="mt-2 space-y-1">
        <div className="text-sm">
          <span className="text-muted-foreground">Starts at:</span> <Badge>{metadata.startsAt}</Badge>
        </div>
        {metadata.endsAt && (
          <div className="text-sm">
            <span className="text-muted-foreground">Ends at:</span> <Badge>{metadata.endsAt}</Badge>
          </div>
        )}
        <div className="text-sm">
          <span className="text-muted-foreground">Location:</span> {metadata.location}
        </div>
      </div>
    </div>
  );
};
