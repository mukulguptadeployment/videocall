"use client";
import { useSocket } from "@/Component/Context";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

export default function Home() {
  const [room, setRoom] = useState();
  const [email, setEmail] = useState();
  const socket = useSocket();
  const router = useRouter();
  const handleroomJoin = (data) => {
    const { email, room } = data;
    router.push(`/room/${room}`);
  };
  useEffect(() => {
    socket.on("room:join", (data) => {
      handleroomJoin(data);
    });
    return () => {
      socket.off("room:join");
    };
  }, [socket, handleroomJoin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit("room:join", { email, room });
  };

  return (
    <main>
      <h1>Lobby</h1>
      <form onSubmit={handleSubmit}>
        <label>
          <span>Enter Your Email</span>
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <br />
        <label>
          <span>Enter Room Number</span>
          <input
            name="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
        </label>
        <button>Join</button>
      </form>
    </main>
  );
}
