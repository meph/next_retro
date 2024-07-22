import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import type { ChangeRetroStateCallback, InitPositionsCallback, InitGroupsCallback } from "@/contexts/RetroContext";
import type { Socket } from "socket.io";
import type { UserData } from "@/contexts/RetroContext";
import { addActionItem, addEverjoined, addGroups, addIdea, addUser, deleteActionItem, deleteIdea, getFullRetro, getFullStore, getRetro, getUser, updateActionItem, updateGroup, updateIdea, updateRetro } from "@/app/api/storage/storage";
import { Idea, Stage, User } from "@prisma/client";
import { IdeaType } from "@/app/api/storage/storageHelpers";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const users: Record<string, Record<string, UserData>> = {};

  const io = new Server(httpServer);

  io.on("connection", (socket: Socket) => {

    socket.on("changeRetroStage", async (retroId: string, stage: Stage, callback: ChangeRetroStateCallback) => {
      try {
        const retro = await getFullRetro(retroId);
        if (!retro) {
          throw new Error();
        }
        retro.stage = stage;
        await updateRetro(retroId, {
          id: retro.id,
          uId: retro.uId,
          retroType: retro.retroType,
          stage: retro.stage,
          createdAt: retro.createdAt,
          createdBy: retro.createdBy,
          everJoined: retro.everJoined,
        });
        callback({ status: 200, retro });
        socket.emit("retroUpdated", retro, retroId);
        socket.broadcast.emit("retroUpdated", retro, retroId);
      } catch {
        callback({ status: 404, error: "Retro not found" });
      }
    });

    socket.on("idea", async (retroId: string, type: IdeaType, message: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const idea = await addIdea(retroId, message, type);
        retro.ideas.push(idea);
        socket.emit("retroUpdated", retro, retroId);
        socket.broadcast.emit("retroUpdated", retro, retroId);
      }
    });

    socket.on("removeIdea", async (retroId: string, ideaId: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const ideaIndex = retro.ideas.findIndex(idea => idea.id === ideaId);
        if (ideaIndex !== -1) {
          retro.ideas.splice(ideaIndex, 1);
          await deleteIdea(ideaId);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }
      }
    });

    socket.on("updateIdea", async (retroId: string, ideaId: string, newType: IdeaType, newIdea: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const ideaIndex = retro.ideas.findIndex(idea => idea.id === ideaId);
        if (ideaIndex !== -1) {
          const idea = retro.ideas[ideaIndex];
          idea.idea = newIdea;
          idea.type = newType;
          await updateIdea(idea.id, idea);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }
      }
    });

    socket.on("initPositions", async (retroId: string, ideas: Idea[], cb: InitPositionsCallback) => {
      const retro = await getRetro(retroId);
      if (retro) {
        await Promise.all(ideas.map(async (idea) => await updateIdea(idea.id, idea)));
        cb({ status: 200 });
        // socket.emit("retroUpdated", retro, retroId);
        // socket.broadcast.emit("retroUpdated", retro, retroId);
      } else {
        cb({ status: 404, error: `Retro with ${retroId} not found`});
      }
    });

    socket.on("updatePosition", async (retroId: string, ideaId: string, newPosition: { x: number; y: number }) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        // retro.ideas.some(async (idea) => {
        retro.ideas.forEach(async (idea) => {
          if (idea.id === ideaId) {
            idea.x = newPosition.x;
            idea.y = newPosition.y;
            await updateIdea(idea.id, idea);
            socket.emit("retroUpdated", retro, retroId);
            socket.broadcast.emit("retroUpdated", retro, retroId);
            // return true;
          }
          // return false;
        });
      }
    });

    socket.on("initGroups", async (retroId: string, groups: Record<string, string[]>, cb: InitGroupsCallback) => {
      const retro = await getRetro(retroId);
      if (retro) {
        // Object.values(groups).map(async (ideaIds) => await addGroup(retroId, ideaIds));
        await addGroups(retroId, Object.values(groups));
        cb({ status: 200 });
      } else {
        cb({ status: 404, error: `Retro with ${retroId} not found`});
      }
    });

    socket.on("updateGroupName", async (retroId: string, groupId: string, newName: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const group = retro.groups.find(group => group.id === groupId);
        if (group) {
          group.name = newName;
          await updateGroup(groupId, group);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }
      }
    });

    socket.on("voteAdd", async (retroId: string, groupId: string, email: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const group = retro.groups.find(group => group.id === groupId);
        const userEmail = retro.everJoined.find(iterEmail => iterEmail === email);
        const userVotes = retro.groups.flatMap(group => group.votes).filter(iterEmail => iterEmail === email).length;
        if (group && userEmail && userVotes < 3) {
          group.votes.push(userEmail);
          await updateGroup(groupId, group);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }
      }
    });

    socket.on("voteSubstract", async (retroId: string, groupId: string, email: string) => {
      const retro = await getFullRetro(retroId);
      const group = retro?.groups.find(group => group.id === groupId);
      if (retro && group) {
        const userEmail = retro.everJoined.find(iterEmail => iterEmail === email) || "";
        const userVoteIdx = group.votes.indexOf(userEmail);
        if (userVoteIdx !== -1) {
          group.votes.splice(userVoteIdx, 1);
          await updateGroup(groupId, group);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }
      }
    });

    socket.on("sendActionItem", async (retroId: string, author: User, assignee: User, item: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const actionItem = await addActionItem(retroId, item, author.email, assignee.email);
        retro.actionItems.push(actionItem);
        socket.emit("retroUpdated", retro, retroId);
        socket.broadcast.emit("retroUpdated", retro, retroId);
      }
    });

    socket.on("removeActionItem", async (retroId: string, actionItemId: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const actionItemIndex = retro.actionItems.findIndex(item => item.id === actionItemId);
        if (actionItemIndex !== -1) {
          await deleteActionItem(actionItemId);
          retro.actionItems.splice(actionItemIndex, 1);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }
      }
    });

    socket.on("updateActionItem", async (retroId: string, actionItemId: string, newAssignee: User, newName: string) => {
      const retro = await getFullRetro(retroId);
      if (retro) {
        const actionItem = retro.actionItems.find(item => item.id === actionItemId);
        if (actionItem) {
          actionItem.assignedEmail = newAssignee.email;
          actionItem.name = newName;
          await updateActionItem(actionItemId, actionItem);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }
      }
    });

    socket.on("upd", async (email) => {
      const store = await getFullStore(email);
      socket.emit("storage", store);
    });

    socket.on("user", async (retroId: string, userData?: UserData) => {
      const retro = await getFullRetro(retroId);
      if (
        userData &&
        userData.email &&
        userData.name &&
        userData.image &&
        retro
      ) {
        const { email, name, image } = userData;
        const user = await getUser(userData.email);
        if (!user) {
          await addUser(email, name, image);
        }

        if (!retro.everJoined.includes(email)) {
          await addEverjoined(retroId, email);
          retro.everJoined.push(email);
          socket.emit("retroUpdated", retro, retroId);
          socket.broadcast.emit("retroUpdated", retro, retroId);
        }

        // Check if the socket id is already associated with another retroId
        for (const existingRetroId in users) {
          if (users[existingRetroId] && users[existingRetroId][socket.id]) {
            delete users[existingRetroId][socket.id];
            socket.emit("users", existingRetroId, users[existingRetroId]);
            break;
          }
        }

        // Check if the email is already associated with another retroId
        for (const existingRetroId in users) {
          for (const existingSocketId in users[existingRetroId]) {
            if (users[existingRetroId][existingSocketId].email === userData.email) {
              delete users[existingRetroId][existingSocketId];
              socket.emit("users", existingRetroId, users[existingRetroId]);
              break;
            }
          }
        }

        // Add the user to the new retroId
        if (!users[retroId]) {
          users[retroId] = {};
        }
        users[retroId][socket.id] = userData;
        socket.emit("users", retroId, users[retroId]);
      }
    });

    // socket.emit("storage", getStore());
    // socket.emit("storage", getFullStore());
    console.log("SERVER: connected");
  });

  io.on("disconnect", (socket: Socket) => {
    for (const retroId in users) {
      if (users[retroId][socket.id]) {
        delete users[retroId][socket.id];
        socket.broadcast.emit("users", retroId, users[retroId]);
        break;
      }
    }
    console.log("SERVER: disconnected");
  });

  httpServer
    .once("error", (err: Error) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
