import { createFileRoute } from "@tanstack/react-router";
import { CosmosApp } from "@/components/cosmos/cosmos-app";

export const Route = createFileRoute("/cosmos")({
  component: CosmosApp,
});
