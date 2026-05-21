import React from "react";

export function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full place-items-center">{children}</div>;
}
