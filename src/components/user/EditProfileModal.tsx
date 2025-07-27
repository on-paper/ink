"use client";

import type { User } from "@cartel-sh/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { uri } from "@lens-protocol/client";
import { setAccountMetadata } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { account, MetadataAttributeType } from "@lens-protocol/metadata";
import { ImageIcon, Loader2, Lock, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Textarea } from "~/components/ui/textarea";
import { detectPlatform, socialPlatforms } from "~/lib/socialPlatforms";
import { getLensClient } from "~/utils/lens/getLensClient";
import { storageClient } from "~/utils/lens/storage";
import { AvatarViewer } from "./AvatarViewer";

const FormSchema = z.object({
  bio: z
    .string()
    .max(300, {
      message: "Bio must not exceed 300 characters.",
    })
    .optional(),
  website: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        id: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

interface EditProfileModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function SocialLinkInput({
  value,
  onChange,
  onRemove,
  showRemove,
}: {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}) {
  const detectedPlatform = detectPlatform(value);
  const Icon = detectedPlatform?.icon;

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <Input
          placeholder="Add a link"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={Icon ? "pl-10" : ""}
        />
      </div>
      {showRemove && (
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} className="h-9 w-9">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function EditProfileModal({ user, open, onOpenChange, onSuccess }: EditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();
  const profilePictureInputId = useId();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bio: user.description || "",
      website: "",
      socialLinks: [],
    },
  });

  const socialLinks = form.watch("socialLinks") || [];

  useEffect(() => {
    if (open) {
      const existingSocialLinks = [];
      let websiteValue = "";

      if (user.metadata?.attributes) {
        for (const attr of user.metadata.attributes) {
          if (attr.key === "website") {
            websiteValue = attr.value.replace(/^https?:\/\//, "");
          } else {
            existingSocialLinks.push({
              id: `existing-${attr.key}-${Date.now()}`,
              value: attr.value,
            });
          }
        }
      }

      if (existingSocialLinks.length === 0 || existingSocialLinks[existingSocialLinks.length - 1].value !== "") {
        existingSocialLinks.push({
          id: Date.now().toString(),
          value: "",
        });
      }

      form.reset({
        bio: user.description || "",
        website: websiteValue,
        socialLinks: existingSocialLinks,
      });
      setProfilePicture(null);
      setProfilePicturePreview(null);
    }
  }, [open, user, form]);

  const removeSocialLink = (index: number) => {
    const currentLinks = form.getValues("socialLinks") || [];
    form.setValue(
      "socialLinks",
      currentLinks.filter((_, i) => i !== index),
    );
  };

  const handleSocialLinkChange = (index: number, value: string) => {
    const currentLinks = form.getValues("socialLinks") || [];
    currentLinks[index] = { ...currentLinks[index], value };

    // Auto-add new field if this is the last field and it has content
    if (index === currentLinks.length - 1 && value !== "") {
      currentLinks.push({ id: Date.now().toString(), value: "" });
    }

    form.setValue("socialLinks", currentLinks);
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image must be less than 8MB");
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    onOpenChange(false);
    const toastId = Math.random().toString();

    try {
      const client = await getLensClient();

      if (!client || !client.isSessionClient()) {
        toast.error("Not authenticated", { id: toastId });
        setIsSubmitting(false);
        return;
      }

      toast.loading("Preparing profile update...", { id: toastId });

      let pictureUri = user.profilePictureUrl;

      if (profilePicture) {
        toast.loading("Uploading profile picture...", { id: toastId });
        const { uri } = await storageClient.uploadFile(profilePicture);
        pictureUri = uri;
      }

      const attributes = [];

      // Add website if provided
      if (data.website) {
        const websiteUrl = data.website.startsWith("http") ? data.website : `https://${data.website}`;
        attributes.push({
          key: "website",
          type: MetadataAttributeType.STRING,
          value: websiteUrl,
        });
      }

      // Add social links
      if (data.socialLinks) {
        for (const link of data.socialLinks) {
          if (link.value) {
            const platform = detectPlatform(link.value);
            if (platform) {
              attributes.push({
                key: platform.value,
                type: MetadataAttributeType.STRING,
                value: platform.getUrl(link.value),
              });
            } else {
              // Store as raw value if platform not detected
              const cleanValue = link.value.trim();
              if (cleanValue) {
                // Store unrecognized links with 'link' key
                attributes.push({
                  key: "link",
                  type: MetadataAttributeType.STRING,
                  value: cleanValue,
                });
              }
            }
          }
        }
      }

      const metadata = account({
        name: user.name || user.username,
        bio: data.bio || undefined,
        picture: pictureUri || undefined,
        attributes: attributes.length > 0 ? attributes : undefined,
      });

      toast.loading("Uploading metadata...", { id: toastId });

      const metadataFile = new File([JSON.stringify(metadata)], "metadata.json", { type: "application/json" });
      const { uri: metadataUri } = await storageClient.uploadFile(metadataFile);

      toast.loading("Updating profile...", { id: toastId });

      const result = await setAccountMetadata(client, {
        metadataUri: uri(metadataUri),
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(client.waitForTransaction);

      if (result.isOk()) {
        toast.success("Profile updated successfully!", { id: toastId });
        onSuccess?.();
        form.reset();
        setProfilePicture(null);
        setProfilePicturePreview(null);
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information and social links.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20">
                  {profilePicturePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={profilePicturePreview}
                        alt="Profile preview"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <AvatarViewer user={user} />
                  )}
                </div>
                <label
                  htmlFor={profilePictureInputId}
                  className="absolute bottom-0 right-0 p-1 bg-background border rounded-full cursor-pointer hover:bg-accent"
                >
                  <ImageIcon className="h-4 w-4" />
                  <input
                    id={profilePictureInputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>

              <div className="flex-1">
                <FormLabel>Username</FormLabel>
                <div className="relative">
                  <Input value={user.username} disabled className="pr-10" />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us about yourself..." className="resize-none" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {(() => {
                          const WebsiteIcon = socialPlatforms.find((p) => p.value === "website")?.icon;
                          return WebsiteIcon ? <WebsiteIcon className="h-4 w-4" /> : null;
                        })()}
                      </div>
                      <Input placeholder="example.com" {...field} className="pl-10" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Social Links</h3>
              {socialLinks.length > 3 ? (
                <ScrollArea className="h-[150px] pr-4">
                  <div className="space-y-2">
                    {socialLinks.map((link, index) => (
                      <SocialLinkInput
                        key={link.id}
                        value={link.value}
                        onChange={(value) => handleSocialLinkChange(index, value)}
                        onRemove={() => removeSocialLink(index)}
                        showRemove={index < socialLinks.length - 1 || link.value !== ""}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="space-y-2">
                  {socialLinks.map((link, index) => (
                    <SocialLinkInput
                      key={link.id}
                      value={link.value}
                      onChange={(value) => handleSocialLinkChange(index, value)}
                      onRemove={() => removeSocialLink(index)}
                      showRemove={index < socialLinks.length - 1 || link.value !== ""}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
