"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DotPattern } from "@/components/ui/dot-pattern"

export function WavesDemo() {
  return (
    <div className="relative min-h-screen bg-black">
      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-6xl font-bold text-white mb-8">Find Your Perfect Movie</h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl text-center">
          Get personalized recommendations and vote for your favorites. Join movie nights and share your experience with others.
        </p>
        <div className="flex gap-4">
          <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold">Watch Solo</button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold">Create Movie Night</button>
        </div>
      </div>
    </div>
  )
}

export function DotPatternDemo() {
  return (
    <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <p className="z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-black dark:text-white">
        Dot Pattern
      </p>
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]",
        )}
      />
    </div>
  )
}

export { WavesDemo } 