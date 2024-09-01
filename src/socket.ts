"use client";

import { io, Socket } from "socket.io-client";

// export const socket = io("http://localhost:3000");

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io("https://retro.gdao.one");
  }
  return socket;
};
