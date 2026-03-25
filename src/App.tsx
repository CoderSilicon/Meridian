"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "lucide-solid";
import { createSignal} from "solid-js";
import ReceiveView from "./components/ReceiveView";
import SendView from "./components/SendView";
export default function Home() {
  const [mode, setMode] = createSignal("selection");
  console.log(import.meta.env)

  return (
    <div class="min-h-screen bg-zinc-950 text-white text-foreground flex flex-col items-center justify-center p-4">
      {/* Animated grid background */}
      <main class="relative z-10 w-full max-w-2xl">
        {/* Selection Mode */}
        {mode() === "selection" && (
          <div class="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div class="space-y-12">
              {/* Header */}
              <div class="text-center space-y-4">
                <div class="flex justify-center items-center">
                <div class=" text-8xl mb-4 lexend-400 border border-dashed border-white w-31 h-31">
                  <img src="/favicon.svg" class="bg-white"/>
                </div></div>
                <h1 class="text-4xl font-bold tracking-tight lexend-300">
                  Meridian
                </h1>
                <p class="text-muted-foreground text-lg lexend-300">
                  Point to Point. Zero Middleman
                </p>
              </div>
            </div>

            {/* Action Cards */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PUSH (Send) */}
              <button
                onClick={() => setMode("send")}
                class="group relative p-px bg-zinc-900  transition-all active:scale-[0.98] hover:bg-white rounded-2xl"
              >
                <div class="bg-black  p-8 flex flex-col gap-10 h-full rounded-2xl">
                  <div class="flex justify-between items-start">
                    <ArrowUp01Icon class="text-white" />
                    <span class="text-[10px] text-zinc-600 font-bold lexend-600 uppercase tracking-[0.2em] group-hover:text-white">
                      Upload
                    </span>
                  </div>
                  <div class="text-left">
                    <h2 class="text-3xl font-bold tracking-tighter lexend-700 group-hover:translate-x-1 transition-transform">
                      Send
                    </h2>
                    <p class="text-[11px] text-zinc-500 lexend-400 uppercase tracking-widest mt-1">
                      Send File
                    </p>
                  </div>
                </div>
              </button>

              {/* PULL (Receive) */}
              <button
                onClick={() => setMode("receive")}
                class="group relative p-px bg-zinc-900 transition-all active:scale-[0.98] hover:bg-white rounded-2xl"
              >
                <div class="bg-black  p-8 flex flex-col gap-10 h-full rounded-2xl">
                  <div class="flex justify-between items-start">
                    <ArrowDown01Icon class="text-white" />
                    <span class="text-[10px] text-zinc-600 font-bold lexend-600 uppercase tracking-[0.2em] group-hover:text-white">
                      Accept
                    </span>
                  </div>
                  <div class="text-left">
                    <h2 class="text-3xl font-bold tracking-tighter lexend-700 group-hover:translate-x-1 transition-transform">
                      Receive
                    </h2>
                    <p class="text-[11px] text-zinc-500 lexend-400 uppercase tracking-widest mt-1">
                      Accept file
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Send Mode */}
        {mode() === "send" && <SendView setMode={setMode} />}

        {/* Receive Mode */}
        {mode() === "receive" && <ReceiveView setMode={setMode} />}
      </main>
    </div>
  );
}
