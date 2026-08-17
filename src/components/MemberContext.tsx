"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Member {
  id: string;
  memberId: string;
  name: string;
  email: string;
  photo: string | null;
  birthday?: string | null;
  totalPoints: number;
}

interface MemberContextValue {
  members: Member[];
  currentMember: Member | null;
  setCurrentMemberId: (id: string) => void;
  refreshMembers: () => Promise<Member[]>;
  loading: boolean;
}

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMemberId, setCurrentMemberIdState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refreshMembers = async () => {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data);
    return data as Member[];
  };

  useEffect(() => {
    refreshMembers().then((data) => {
      const saved = localStorage.getItem("currentMemberId");
      if (saved && data.find((m: Member) => m.id === saved)) {
        setCurrentMemberIdState(saved);
      } else if (data.length > 0) {
        setCurrentMemberIdState(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const setCurrentMemberId = (id: string) => {
    setCurrentMemberIdState(id);
    localStorage.setItem("currentMemberId", id);
  };

  const currentMember =
    members.find((m) => m.id === currentMemberId) ?? null;

  return (
    <MemberContext.Provider
      value={{
        members,
        currentMember,
        setCurrentMemberId,
        refreshMembers,
        loading,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used within MemberProvider");
  return ctx;
}

export function MemberSelector() {
  const { members, currentMember, setCurrentMemberId, loading } = useMember();

  if (loading) {
    return (
      <div className="h-10 w-48 animate-pulse rounded-xl bg-ocher-light/30" />
    );
  }

  return (
    <select
      value={currentMember?.id ?? ""}
      onChange={(e) => setCurrentMemberId(e.target.value)}
      className="rounded-xl border border-ocher/30 bg-white/80 px-4 py-2.5 text-sm font-medium text-charcoal shadow-sm transition-all focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20"
    >
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name} ({member.memberId})
        </option>
      ))}
    </select>
  );
}
