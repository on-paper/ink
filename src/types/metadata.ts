// Native type definitions for post metadata (replacing lens-protocol types)

export interface MediaAsset {
  item: string;
  type: string;
  altTag?: string;
  cover?: string;
  artist?: string;
  title?: string;
}

export interface BaseMetadata {
  __typename: string;
  content: string;
  title?: string;
  attachments?: Array<{ item: string; type: string }>;
}

export interface TextOnlyMetadataDetails extends BaseMetadata {
  __typename: "TextOnlyMetadata";
}

export interface ArticleMetadataDetails extends BaseMetadata {
  __typename: "ArticleMetadata";
}

export interface ImageMetadataDetails extends BaseMetadata {
  __typename: "ImageMetadata";
  image: MediaAsset;
}

export interface VideoMetadataDetails extends BaseMetadata {
  __typename: "VideoMetadata";
  video: MediaAsset;
}

export interface AudioMetadataDetails extends BaseMetadata {
  __typename: "AudioMetadata";
  audio: MediaAsset;
}

export interface LinkMetadataDetails extends BaseMetadata {
  __typename: "LinkMetadata";
  sharingLink: string;
}

export interface LiveStreamMetadataDetails extends BaseMetadata {
  __typename: "LiveStreamMetadata";
}

export interface CheckingInMetadataDetails extends BaseMetadata {
  __typename: "CheckingInMetadata";
}

export interface EmbedMetadataDetails extends BaseMetadata {
  __typename: "EmbedMetadata";
  embed: string;
}

export interface EventMetadataDetails extends BaseMetadata {
  __typename: "EventMetadata";
  location: string;
  startsAt: string;
  endsAt?: string;
}

export interface MintMetadataDetails extends BaseMetadata {
  __typename: "MintMetadata";
}

export interface SpaceMetadataDetails extends BaseMetadata {
  __typename: "SpaceMetadata";
}

export interface StoryMetadataDetails extends BaseMetadata {
  __typename: "StoryMetadata";
}

export interface TransactionMetadataDetails extends BaseMetadata {
  __typename: "TransactionMetadata";
}

export interface ThreeDMetadataDetails extends BaseMetadata {
  __typename: "ThreeDMetadata";
}

export type MediaAttachment = {
  item: string;
  type: string;
};

export type AnyMetadata =
  | TextOnlyMetadataDetails
  | ArticleMetadataDetails
  | ImageMetadataDetails
  | VideoMetadataDetails
  | AudioMetadataDetails
  | LinkMetadataDetails
  | LiveStreamMetadataDetails
  | CheckingInMetadataDetails
  | EmbedMetadataDetails
  | EventMetadataDetails
  | MintMetadataDetails
  | SpaceMetadataDetails
  | StoryMetadataDetails
  | TransactionMetadataDetails
  | ThreeDMetadataDetails;
