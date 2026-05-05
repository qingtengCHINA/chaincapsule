"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Heart } from "@phosphor-icons/react";

interface CapsuleLikeProps {
  capsuleId: number;
}

export default function CapsuleLike({ capsuleId }: CapsuleLikeProps) {
  const { address, isConnected } = useAccount();
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLikes = useCallback(async () => {
    try {
      const params = new URLSearchParams({ capsuleId: String(capsuleId) });
      if (address) params.set("wallet", address);

      const res = await fetch(`/api/likes?${params}`);
      const data = await res.json();
      setLikes(data.likes);
      setUserLiked(data.userLiked);
    } catch (err) {
      console.error("Failed to fetch likes:", err);
    }
  }, [capsuleId, address]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const toggleLike = async () => {
    if (!isConnected || !address) return;
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsuleId, walletAddress: address }),
      });
      const data = await res.json();
      setLikes(data.likes);
      setUserLiked(data.userLiked);

      if (data.userLiked) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={!isConnected || loading}
      className="flex items-center gap-1.5 group transition-all duration-200"
      title={isConnected ? (userLiked ? "Unlike" : "Like") : "Connect wallet to like"}
    >
      <span
        className={`relative inline-flex transition-transform duration-300 ${
          animating ? "scale-125" : "scale-100"
        } ${userLiked ? "text-red-500" : "text-neutral-400 group-hover:text-red-400"} ${
          !isConnected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {userLiked ? (
          <Heart weight="fill" size={22} className="animate-pulse-once" />
        ) : (
          <Heart size={22} />
        )}
      </span>
      <span
        className={`text-sm font-medium tabular-nums ${
          userLiked ? "text-red-500" : "text-neutral-400 group-hover:text-red-400"
        }`}
      >
        {likes}
      </span>
    </button>
  );
}
