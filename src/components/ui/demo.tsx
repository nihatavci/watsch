"use client"

import * as React from "react"
import { Waves } from "@/components/ui/wave-background"

export function WavesDemo() {
  return (
    <div className="relative min-h-screen bg-black">
      {/* Waves background absolutely positioned */}
      <div className="absolute inset-0 h-[500px] z-0 pointer-events-none">
        <Waves />
      </div>
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

export { WavesDemo } 