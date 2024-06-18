"use client";
import { useSocket } from "@/Component/Context";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../../../service/peer";

const RoomPage = ({ params }) => {
  const socket = useSocket();
  const [socketid, setRemoteSocketID] = useState(null);
  const [mystream, setMyStream] = useState(null);
  const [otherstream, setOtherStream] = useState(null);
  const [user, setUser] = useState(null);

  const userJoin = ({ email, id }) => {
    console.log("User " + email + " has Joined");
    setUser(email);
    setRemoteSocketID(id);
  };

  const id = params.slug;

  const handleCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: socketid, offer });
    setMyStream(stream);
  };

  const handleIncomingCall = async ({ from, offer }) => {
    console.log("Incoming Call.... ", offer);
    setRemoteSocketID(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setMyStream(stream);
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, ans });
  };

  const sendStream = () => {
    for (const track of mystream.getTracks()) {
      peer.peer.addTrack(track, mystream);
    }
  };

  const handleCallAccepted = async ({ from, ans }) => {
    peer.setLocalDescription(ans);
    sendStream();
    console.log("Call Accepted");
  };

  const handleNegotiationNeeded = async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: socketid });
  };

  const handleincomeNegotiation = async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  };

  const handleNegoFinal = async ({ans}) => {
    console.log("final nego", ans);
    peer.setLocalDescription(ans);
  };

  // For Track
  useEffect(() => {
    peer.peer.addEventListener("track", async (e) => {
      const stream = e.streams;
      console.log("GOT TRACKS!!");
      setOtherStream(stream[0]);
    });
  }, []);

  //   handle negotiation
  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
    return () => {
      peer.peer.removeEventListener(
        "negotiationneeded",
        handleNegotiationNeeded
      );
    };
  }, [handleNegotiationNeeded]);

  // For Sockets
  useEffect(() => {
    socket.on("user:joined", userJoin);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleincomeNegotiation);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", userJoin);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("peer:nego:needed", handleincomeNegotiation);
      socket.off("peer:nego:final", handleNegoFinal);
      socket.off("call:accepted", handleCallAccepted);
    };
  }, [
    socket,
    userJoin,
    handleIncomingCall,
    handleincomeNegotiation,
    handleNegoFinal,
    handleCallAccepted,
  ]);

  return (
    <div>
      <h1>Room {id} Page</h1>
      <h2>{socketid ? "Connected" : "No one in Room"}</h2>
      {socketid && <button onClick={handleCall}>Call User</button>}
      {mystream && (
        <>
          <h1>My Video</h1>
          <ReactPlayer muted playing height={100} width={200} url={mystream} />
        </>
      )}
      {otherstream && (
        <>
          <h1>{user} Video</h1>
          <ReactPlayer
            muted
            playing
            height={100}
            width={200}
            url={otherstream}
          />
        </>
      )}
    </div>
  );
};

export default RoomPage;
