"use client";
import ActionItems from "@/components/RetroStages/ActionItems";
import Finished from "@/components/RetroStages/Finished";
import Grouping from "@/components/RetroStages/Grouping";
import GroupLabeling from "@/components/RetroStages/GroupLabeling";
import IdeaGeneration from "@/components/RetroStages/IdeaGeneration";
import PrimeDirective from "@/components/RetroStages/PrimeDirective";
import RetroLobby from "@/components/RetroStages/RetroLobby";
import Voting from "@/components/RetroStages/Voting";
import { GetRetroCallback, Retro, useRetroContext } from "@/contexts/RetroContext";
import { get } from "http";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function RetroPage({ params }: { params: { retro_id: string } }) {
  const { retros, isLoading, updStorage, sendUserData } = useRetroContext();
  const { data } = useSession();
  const [retroData, setRetroData] = useState(retros[params.retro_id]);

  useEffect(() => {
    setRetroData(retros[params.retro_id]);
  }, [params.retro_id, retros]);

  useEffect(() => {
    if (data?.user) {
      sendUserData(params.retro_id, data.user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.user, params.retro_id]);

  if (!retroData || !data?.user) {
    setTimeout(() => {
      if (isLoading) {
        updStorage();
      }
    }, 1500);
    return (
      <div className="flex-grow flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="text-lg font-bold">Loading...</div>
          <span className="loading loading-spinner loading-lg mt-2"></span>
        </div>
      </div>
    );
  }

  const { createdBy, stage } = retroData;
  return (
    <>
      {stage === "lobby" && <RetroLobby id={params.retro_id} createdBy={createdBy} />}
      {stage === "prime_directive" && <PrimeDirective id={params.retro_id} createdBy={createdBy} />}
      {stage === "idea_generation" && <IdeaGeneration id={params.retro_id} createdBy={createdBy} />}
      {stage === "grouping" && <Grouping id={params.retro_id} createdBy={createdBy} />}
      {stage === "group_labeling" && <GroupLabeling id={params.retro_id} createdBy={createdBy} />}
      {stage === "voting" && <Voting id={params.retro_id} createdBy={createdBy} />}
      {stage === "action_items" && <ActionItems id={params.retro_id} createdBy={createdBy} />}
      {stage === "finished" && <Finished id={params.retro_id} createdBy={createdBy} />}
    </>
  );
}
