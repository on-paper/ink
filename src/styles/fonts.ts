import localFont from "next/font/local";

export const quicksand = localFont({
  src: [
    { path: "../../public/fonts/Quicksand-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Quicksand-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Quicksand-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-quicksand",
});
