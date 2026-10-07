"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { HeroNetworkFallback } from "@/components/three/HeroNetworkFallback";

const HeroNeuralNetwork = dynamic(
  () => import("./HeroNeuralNetwork"),
  {
    ssr: false,
    loading: () => <HeroNetworkFallback />,
  }
);

export function HeroSphereClient() {
  return (
    <Suspense fallback={<HeroNetworkFallback />}>
      <HeroNeuralNetwork />
    </Suspense>
  );
}
