"use client";
import React, { memo, useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { notify } from "@/helpers";
import { useRetroContext } from "@/contexts/RetroContext";
import { ConfirmModal, WelcomeModal } from "@/components/Modals";
import useAuthor from "@/hooks/useAuthor";
import { GroupVoted } from "../Finished";
import FooterWInput from "../../FooterWInput";
import ActionItem from "./ActionItem";


interface ActionItems {
  id: string;
  createdBy: string;
}

const ActionItems: React.FC<ActionItems> = ({ id, createdBy }) => {
  const { data } = useSession();
  const isAuthor = useAuthor(createdBy);
  const [loading, setLoading] = useState(false);
  const { changeRetroStage, retros, sendActionItem, getGroup } = useRetroContext();
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [assignee, setAssignee] = useState(retros[id].everJoinedUsers[0]);

  const handleConfirm = () => {
    setLoading(true);
    const retro = retros[id];
    const mapEmails = retro.everJoinedUsers.reduce((acc, user) => {
      acc[user.email] = user.name;
      return acc;
    }, {} as { [key: string]: string });

    fetch(new URL("/api/mailer", "https://retro.gdao.one"), {
      method: "POST",
      body: JSON.stringify({
        to: retro.everJoined,
        subject: "Action items from Retro",
        text: retro.actionItems
          .map(item =>
            `${item.name} (${mapEmails[item.assignedEmail]})`)
          .join("\n"),
        retro,
      }),
    });

    changeRetroStage(id, "finished", (res) => {
      if (res.status !== 200) {
        setLoading(false);
        notify("error", "Couldnt update retro stage", document.getElementById("confirm_modal"));
      }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sender = retros[id].everJoinedUsers.find(user => user.email === data?.user?.email);
    if (sender) {
      sendActionItem(id, sender, assignee, message);
      setMessage("");
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = retros[id].everJoinedUsers.find(user => user.name === e.target.value);
    if (user) {
      setAssignee(user);
      if (inputRef.current) {
        inputRef.current.select();
        inputRef.current.focus();
      }
    }
  };

  return (
    <>
      <main className="flex-grow flex h-full pt-4 overflow-y-scroll">
        <div className="flex flex-col w-1/2 md:w-2/3 lg:w-3/4 mx-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {retros[id].groups.sort((ga, gb) => gb.votes.length - ga.votes.length).map((group) => (
              <GroupVoted
                key={group.id}
                groupId={group.id}
                retroId={id}
                name={getGroup(id, group.id)?.name || ""}
                ideaIds={group.ideas}
              />
            ))}
          </div>
        </div>
        <div
          className="w-1/2 md:w-1/3 lg:w-1/4 mr-4"
        >
          <div
            className="text-center text-xl font-bold mb-4 border-b pb-1 border-b-2 border-current"
          >
            🚀 Action Items
          </div>
          {retros[id] && retros[id].actionItems.sort((a, b) => a.id - b.id).map((iterItem) => (
            <ActionItem
              retroId={id}
              id={iterItem.id}
              actionItem={iterItem}
              key={iterItem.id}
              isAuthor={isAuthor}
            />
          ))}
        </div>
      </main>
      <FooterWInput
        options={retros[id] && retros[id].everJoinedUsers.map(user => user.name)}
        selectedOption={assignee && assignee.name}
        handleSubmit={handleSubmit}
        onSelectChange={handleSelectChange}
        buttonTag="Send Action Items 📨"
        isAuthor={isAuthor}
        message={message}
        setMessage={setMessage}
        ref={inputRef}
      />
      <ConfirmModal
        message="Are you sure you want to distribute this retrospective's action items? This will close the retro."
        loading={loading}
        onConfirm={handleConfirm}
      />
      <WelcomeModal
        title="Stage Change: Action-Item Generation!"
        body={
          <>
            Guidance:
            <ul className="list-disc list-inside ml-4">
              <li>Discuss the highest-voted items on the board.</li>
              <li>Generate action-items aimed at:</li>
              <div className="pl-6">
                - exploding the team&apos;s bottlenecks
              </div>
              <div className="pl-6">
                - bolstering the team&apos;s successes
              </div>
              <li>If you&apos;re physically present in the room with the facilitator, put your laptop away so you can focus.</li>
            </ul>
          </>
        }
      />
    </>
  );
};

export default memo(ActionItems);
