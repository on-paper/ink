import type { PostMention } from "@cartel-sh/ui";
import {
  ArticleMetadataDetails,
  AudioMetadataDetails,
  CheckingInMetadataDetails,
  EmbedMetadataDetails,
  EventMetadataDetails,
  ImageMetadataDetails,
  LinkMetadataDetails,
  LiveStreamMetadataDetails,
  MintMetadataDetails,
  SpaceMetadataDetails,
  StoryMetadataDetails,
  TextOnlyMetadataDetails,
  ThreeDMetadataDetails,
  TransactionMetadataDetails,
  VideoMetadataDetails,
} from "@lens-protocol/metadata";
import { castToMediaImageType, castToMediaVideoType, isImageMimeType } from "~/utils/mimeTypes";
import { AudioPlayer } from "../AudioPlayer";
import { LinkPreview } from "../embeds/LinkPreview";
import { ImageViewer } from "../ImageViewer";
import Markdown, { extractUrlsFromText } from "../Markdown";
import { Badge } from "../ui/badge";
import { VideoPlayer } from "../VideoPlayer";

export const getPostTextContent = (
  metadata: any,
  mentions?: PostMention[],
  showLinkPreviews = false,
): React.ReactNode => {
  const content = metadata?.content || "";

  switch (metadata.__typename) {
    case "TextOnlyMetadata":
    case "ArticleMetadata":
    case "ImageMetadata":
    case "VideoMetadata":
    case "AudioMetadata":
    case "LiveStreamMetadata":
    case "CheckingInMetadata":
    case "EmbedMetadata":
    case "MintMetadata":
    case "SpaceMetadata":
    case "StoryMetadata":
    case "TransactionMetadata":
    case "ThreeDMetadata":
      return <ContentView content={content} mentions={mentions} showLinkPreviews={showLinkPreviews} />;
    case "LinkMetadata":
      return <LinkView metadata={metadata as LinkMetadataDetails} mentions={mentions} />;
    case "EventMetadata":
      return <EventView metadata={metadata as EventMetadataDetails} mentions={mentions} />;
    default:
      return null;
  }
};

export const getPostMediaContent = (metadata: any, postId?: string, authorHandle?: string): React.ReactNode => {
  switch (metadata.__typename) {
    case "ImageMetadata":
      return getImageMediaContent(metadata as ImageMetadataDetails, authorHandle);
    case "VideoMetadata":
      return getVideoMediaContent(metadata as VideoMetadataDetails, authorHandle);
    case "AudioMetadata":
      return getAudioMediaContent(metadata as AudioMetadataDetails, postId);
    default:
      return null;
  }
};

export const getPostLinkPreviews = (metadata: any): string[] => {
  const content = metadata?.content || "";

  if (metadata.__typename === "LinkMetadata") {
    return [];
  }

  if (metadata.__typename === "EmbedMetadata") {
    return [];
  }

  return extractUrlsFromText(content);
};

export const getPostMetadataView = (metadata: any, mentions?: PostMention[]) => {
  switch (metadata.__typename) {
    case "TextOnlyMetadata":
      return <TextOnlyView metadata={metadata as TextOnlyMetadataDetails} mentions={mentions} />;
    case "ArticleMetadata":
      return <ArticleView metadata={metadata as ArticleMetadataDetails} mentions={mentions} />;
    case "ImageMetadata":
      return <ImageView metadata={metadata as ImageMetadataDetails} mentions={mentions} />;
    case "VideoMetadata":
      return <VideoView metadata={metadata as VideoMetadataDetails} mentions={mentions} />;
    case "AudioMetadata":
      return <AudioView metadata={metadata as AudioMetadataDetails} mentions={mentions} />;
    case "LinkMetadata":
      return <LinkView metadata={metadata as LinkMetadataDetails} mentions={mentions} />;
    case "LiveStreamMetadata":
      return <LiveStreamView metadata={metadata as LiveStreamMetadataDetails} mentions={mentions} />;
    case "CheckingInMetadata":
      return <CheckingInView metadata={metadata as CheckingInMetadataDetails} mentions={mentions} />;
    case "EmbedMetadata":
      return <EmbedView metadata={metadata as EmbedMetadataDetails} mentions={mentions} />;
    case "EventMetadata":
      return <EventView metadata={metadata as EventMetadataDetails} mentions={mentions} />;
    case "MintMetadata":
      return <MintView metadata={metadata as MintMetadataDetails} mentions={mentions} />;
    case "SpaceMetadata":
      return <SpaceView metadata={metadata as SpaceMetadataDetails} mentions={mentions} />;
    case "StoryMetadata":
      return <StoryView metadata={metadata as StoryMetadataDetails} mentions={mentions} />;
    case "TransactionMetadata":
      return <TransactionView metadata={metadata as TransactionMetadataDetails} mentions={mentions} />;
    case "ThreeDMetadata":
      return <ThreeDView metadata={metadata as ThreeDMetadataDetails} mentions={mentions} />;
    default:
      return null;
  }
};

const ContentView = ({
  content,
  mentions,
  showLinkPreviews = false,
}: {
  content: string;
  mentions?: PostMention[];
  showLinkPreviews?: boolean;
}) => {
  return <Markdown content={content} mentions={mentions} showLinkPreviews={showLinkPreviews} />;
};

export const TextOnlyView = ({
  metadata,
  mentions,
}: {
  metadata: TextOnlyMetadataDetails;
  mentions?: PostMention[];
}) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

export const ArticleView = ({ metadata, mentions }: { metadata: ArticleMetadataDetails; mentions?: PostMention[] }) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

const getImageMediaContent = (metadata: ImageMetadataDetails, authorHandle?: string): React.ReactNode => {
  const url = metadata?.image?.item;
  const alt = metadata?.image.altTag;
  const title = metadata?.title;
  const attachments = metadata?.attachments;

  const allMedia: MediaAttachment[] = [];
  if (url) {
    allMedia.push({ item: url, type: castToMediaImageType(metadata.image.type) });
  }
  if (attachments && Array.isArray(attachments)) {
    attachments.forEach((att: any) => {
      if (att.item && att.type) {
        allMedia.push({ item: att.item, type: castToMediaImageType(att.type) });
      }
    });
  }

  return allMedia.length > 1 ? (
    <MediaGallery items={allMedia} authorHandle={authorHandle} />
  ) : allMedia.length === 1 ? (
    <div className="relative mt-2">
      <ImageViewer
        src={allMedia[0].item}
        alt={alt || title}
        className="object-contain border rounded-xl max-h-[300px] w-auto"
      />
    </div>
  ) : null;
};

export const ImageView = ({ metadata, mentions }: { metadata: ImageMetadataDetails; mentions?: PostMention[] }) => {
  return (
    <div>
      <ContentView content={metadata.content} mentions={mentions} />
      {getImageMediaContent(metadata)}
    </div>
  );
};

const getVideoMediaContent = (metadata: VideoMetadataDetails, authorHandle?: string): React.ReactNode => {
  const url = metadata?.video?.item;
  const cover = metadata?.video?.cover || undefined;
  const attachments = metadata?.attachments;

  const allMedia: MediaAttachment[] = [];
  if (url) {
    allMedia.push({ item: url, type: castToMediaVideoType(metadata.video.type) });
  }
  if (attachments && Array.isArray(attachments)) {
    attachments.forEach((att: any) => {
      if (att.item && att.type) {
        // Normalize the type - it could be either image or video
        const normalizedType = isImageMimeType(att.type)
          ? castToMediaImageType(att.type)
          : castToMediaVideoType(att.type);
        allMedia.push({ item: att.item, type: normalizedType });
      }
    });
  }

  return allMedia.length > 1 ? (
    <MediaGallery items={allMedia} authorHandle={authorHandle} />
  ) : allMedia.length === 1 ? (
    <div className="mt-2" style={{ maxHeight: "min(100%, 300px)" }}>
      <VideoPlayer url={allMedia[0].item} preview={cover} autoplay={true} authorHandle={authorHandle} />
    </div>
  ) : null;
};

export const VideoView = ({ metadata, mentions }: { metadata: VideoMetadataDetails; mentions?: PostMention[] }) => {
  return (
    <div>
      <ContentView content={metadata.content} mentions={mentions} />
      {getVideoMediaContent(metadata)}
    </div>
  );
};

const getAudioMediaContent = (metadata: AudioMetadataDetails, postId?: string): React.ReactNode => {
  const url = metadata?.audio?.item;
  const cover = metadata?.audio.cover;
  const artist = metadata?.audio.artist;
  const title = metadata?.title;

  return <AudioPlayer url={url} cover={cover} author={artist} title={title} postId={postId} />;
};

export const AudioView = ({ metadata, mentions }: { metadata: AudioMetadataDetails; mentions?: PostMention[] }) => {
  return (
    <div>
      <ContentView content={metadata.content} mentions={mentions} />
      {getAudioMediaContent(metadata)}
    </div>
  );
};

export const LinkView = ({ metadata, mentions }: { metadata: LinkMetadataDetails; mentions?: PostMention[] }) => {
  // Check if the content already contains the sharing link
  const contentContainsLink = metadata.content.includes(metadata.sharingLink);

  return (
    <div>
      <ContentView content={metadata.content} mentions={mentions} />
      {/* Only show additional preview if the link is not already in the content */}
      {!contentContainsLink && (
        <div className="mt-4">
          <LinkPreview url={metadata.sharingLink} />
        </div>
      )}
    </div>
  );
};

export const LiveStreamView = ({
  metadata,
  mentions,
}: {
  metadata: LiveStreamMetadataDetails;
  mentions?: PostMention[];
}) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

export const CheckingInView = ({
  metadata,
  mentions,
}: {
  metadata: CheckingInMetadataDetails;
  mentions?: PostMention[];
}) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

export const EmbedView = ({ metadata, mentions }: { metadata: EmbedMetadataDetails; mentions?: PostMention[] }) => {
  return (
    <div>
      <ContentView content={metadata.content} mentions={mentions} />
      {metadata.embed && (
        <div className="mt-4">
          <LinkPreview url={metadata.embed} />
        </div>
      )}
    </div>
  );
};

export const EventView = ({ metadata }: { metadata: EventMetadataDetails; mentions?: PostMention[] }) => {
  return (
    <div>
      <h1>Event</h1>
      Starts at: <Badge>{metadata.startsAt}</Badge>
      Ends at: {metadata.endsAt}
      Where: {metadata.location}
    </div>
  );
};

export const MintView = ({ metadata, mentions }: { metadata: MintMetadataDetails; mentions?: PostMention[] }) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

export const SpaceView = ({ metadata, mentions }: { metadata: SpaceMetadataDetails; mentions?: PostMention[] }) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

export const StoryView = ({ metadata, mentions }: { metadata: StoryMetadataDetails; mentions?: PostMention[] }) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

export const TransactionView = ({
  metadata,
  mentions,
}: {
  metadata: TransactionMetadataDetails;
  mentions?: PostMention[];
}) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

export const ThreeDView = ({ metadata, mentions }: { metadata: ThreeDMetadataDetails; mentions?: PostMention[] }) => {
  return <ContentView content={metadata.content} mentions={mentions} />;
};

type MediaAttachment = {
  item: string;
  type: string;
};

const MediaGallery = ({ items, authorHandle }: { items: MediaAttachment[]; authorHandle?: string }) => {
  const hasMixedMedia = items.some(item => item.type && isImageMimeType(String(item.type))) && 
                        items.some(item => item.type && !isImageMimeType(String(item.type)));
  const firstVideoIndex = items.findIndex(item => item.type && !isImageMimeType(String(item.type)));
  
  return (
    <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ height: "300px" }}>
      <div className="flex gap-2 h-full items-center" style={{ width: "max-content" }}>
        {items.map((item, index) => {
          const isFirstVideo = index === firstVideoIndex;
          
          return (
            <div key={`${item.item}-${index}`} className="h-full flex items-center">
              {item.type && isImageMimeType(String(item.type)) ? (
                <ImageViewer
                  src={item.item}
                  alt={`Gallery image ${index + 1}`}
                  className="h-full max-h-[300px] w-auto object-contain border rounded-xl cursor-pointer"
                  galleryItems={items}
                  currentIndex={index}
                />
              ) : (
                <div className="h-full flex items-center" style={{ height: "300px" }}>
                  <VideoPlayer url={item.item} preview="" galleryItems={items} currentIndex={index} autoplay={isFirstVideo} authorHandle={authorHandle} useModal={hasMixedMedia} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
