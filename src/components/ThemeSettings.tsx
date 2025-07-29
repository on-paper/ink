"use client";

// import { CheckIcon, ImageIcon, RefreshCwIcon } from "lucide-react";
// import { useRef } from "react";
import { ThemeToggle } from "~/components/ThemeToggle";
// import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
// import { Separator } from "~/components/ui/separator";
// import { Slider } from "~/components/ui/slider";
// import { type BackgroundColor, useBackgroundTheme } from "~/hooks/useBackgroundTheme";

// interface ColorButtonProps {
//   color: BackgroundColor;
//   isSelected: boolean;
//   onSelect: () => void;
// }

// function ColorButton({ color, isSelected, onSelect }: ColorButtonProps) {
//   const { r, g, b } = color.rgb;

//   return (
//     <button
//       type="button"
//       onClick={onSelect}
//       className={`relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 overflow-hidden ${
//         isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
//       }`}
//       title={color.name}
//     >
//       {color.id === "black_and_white" ? (
//         <>
//           <div className="absolute inset-0 bg-black" />
//           <div className="absolute inset-0 bg-white" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
//         </>
//       ) : (
//         <div className="absolute inset-0" style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }} />
//       )}
//       {isSelected && (
//         <div className="absolute inset-0 flex items-center justify-center">
//           <div className="rounded-full p-0.5 bg-white">
//             <CheckIcon size={16} className="text-black" />
//           </div>
//         </div>
//       )}
//     </button>
//   );
// }

export function ThemeSettings() {
  // const {
  //   backgroundColorId,
  //   setBackgroundColorId,
  //   backgroundMode,
  //   setBackgroundMode,
  //   availableColors,
  //   fetchRandomImage,
  //   imageLoading,
  //   imageCredits,
  //   intensity,
  //   setIntensity,
  //   blur,
  //   setBlur,
  //   selectLocalImage,
  // } = useBackgroundTheme();

  // const fileInputRef = useRef<HTMLInputElement>(null);

  // const handleModeChange = (mode: "none" | "gradient" | "image") => {
  //   setBackgroundMode(mode);
  // };

  // const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     selectLocalImage(file);
  //     setBackgroundColorId("default");
  //   }
  // };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Dark Mode</h3>
              <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Background</h3>
            <p className="text-xs text-muted-foreground">Choose a background style and color</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModeChange("none")}
              className={`flex-1 ${backgroundMode === "none" ? "bg-secondary/70" : ""}`}
            >
              None
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModeChange("gradient")}
              className={`flex-1 ${backgroundMode === "gradient" ? "bg-secondary/70" : ""}`}
            >
              Gradient
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleModeChange("image")}
              className={`flex-1 ${backgroundMode === "image" ? "bg-secondary/70" : ""}`}
              disabled={imageLoading}
            >
              {imageLoading ? "Loading..." : "Image"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <ColorButton
                key={color.id}
                color={color}
                isSelected={backgroundColorId === color.id}
                onSelect={async () => {
                  setBackgroundColorId(color.id);
                  if (backgroundMode === "image") {
                    await fetchRandomImage(color.id);
                  }
                }}
              />
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Intensity</span>
                <span className="text-sm text-muted-foreground">{Math.round(intensity * 100)}%</span>
              </div>
              <Slider
                value={[intensity]}
                onValueChange={([value]) => setIntensity(value)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blur</span>
                <span className="text-sm text-muted-foreground">{Math.round(blur)}px</span>
              </div>
              <Slider
                value={[blur]}
                onValueChange={([value]) => setBlur(value)}
                min={0}
                max={20}
                step={0.5}
                className="w-full"
              />
            </div>
          </div>

          {backgroundMode === "image" && (
            <div className="space-y-3 mt-4">
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs hover:bg-secondary/70"
                >
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Choose an image
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchRandomImage(backgroundColorId)}
                  disabled={imageLoading}
                  className="text-xs hover:bg-secondary/70"
                >
                  <RefreshCwIcon className={`w-3 h-3 mr-1 ${imageLoading ? "animate-spin" : ""}`} />
                  New random image
                </Button>
              </div>

              {imageCredits && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Photo by{" "}
                    <a
                      href={`https://unsplash.com/@${imageCredits.username}?utm_source=paper&utm_medium=referral`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      {imageCredits.name}
                    </a>
                    {" on "}
                    <a
                      href="https://unsplash.com?utm_source=paper&utm_medium=referral"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Unsplash
                    </a>
                  </p>
                  <a
                    href={imageCredits.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block"
                  >
                    View original →
                  </a>
                </div>
              )}
            </div>
          )}
        </div> */}
      </CardContent>
    </Card>
  );
}
