/* eslint-disable react/no-unescaped-entities */
import { Cookie, FileIcon, Github } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Paper",
  openGraph: {
    title: "About",
    description: "About Paper",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

import Link from "~/components/Link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

const AboutPage = () => {
  return (
    <>
      <div className="flex flex-col max-w-2xl mx-auto items-center p-2 sm:p-4 md:p-20 gap-8">
        <h1 className="font-bold text-4xl">About Paper</h1>
        <h2 className="text-2xl">a focus-first decentralized social</h2>
        <div className="flex flex-col text-center  gap-8 p-2 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>what?</CardTitle>
            </CardHeader>
            <CardContent>
              this project is an attempt to provide a better decentralized social experience -{" "}
              <b>staying out of your way to reach your people.</b>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>why?</CardTitle>
            </CardHeader>
            <CardContent>
              providing a place to express yourself, made <b>for you </b> and <b>your community</b>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>who?</CardTitle>
            </CardHeader>
            <CardContent>
              made with love by cartel
            </CardContent>
          </Card>
        </div>
        <Card className="hover:bg-card w-full flex flex-col gap-4 place-items-center mx-auto max-w-3xl my-10">
          <CardHeader>
            <CardTitle> FAQ </CardTitle>
          </CardHeader>
          <CardContent className="w-full max-w-3xl">
            <div className="w-full max-w-3xl">
              <Accordion type="single">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Current status?</AccordionTrigger>
                  <AccordionContent>
                    In development. Paper is live on Ethereum!
                    <br />
                    <a className="underline" href="https://github.com/on-paper/ink">
                      Contributions
                    </a>{" "}
                    are welcome.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is it any good?</AccordionTrigger>
                  <AccordionContent>Yes.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8 place-items-center justify-center p-4 drop-shadow-lg dark:drop-shadow-glow my-10">
          <Link href="https://github.com/on-paper/ink">
            <Button variant="ghost" className="p-1 px-4 text-lg gap-4 flex flex-row w-fit rounded-full">
              <Github /> github
            </Button>
          </Link>
          <Link href="/policy">
            <Button variant="ghost" className="p-1 px-4 text-lg gap-4 flex flex-row w-fit rounded-full">
              <Cookie /> Privacy
            </Button>
          </Link>
          <Link href="/tos">
            <Button variant="ghost" className="p-1 px-4 text-lg gap-4 flex flex-row w-fit rounded-full">
              <FileIcon /> ToS
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
