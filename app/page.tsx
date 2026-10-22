import Image from "next/image";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import heroimage from "@/assets/heroImage.png"

export default async function Home() {
  return (
    <section
           className="max-w-7xl mx-auto grid md:grid-cols-3 lg:grid-cols-2 grid-cols-1 items-center px-4 py-48"
       >
           <div className="flex flex-col gap-12 md:col-span-2 lg:col-span-1">
               <h1>Anlässe organisieren, ohne Excel-Chaos.</h1>
               <p className="text-black">
                 Anmeldungen, Teilnehmerlisten und Bestätigungen an einem Ort, gemacht für Verbände und Vereine.
               </p>
               <div className="flex flex-col md:flex-row gap-4">
                   <Button asChild size="lg" className="px-8">
                     <Link href="#features">So funktioniert’s</Link>
                   </Button>
               </div>
           </div>
           <Image
                src={heroimage }
                alt="Hero Image von dabei"
           />
      </section>
  );
}
