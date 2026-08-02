"use client";

import React from "react";
import { EventFormProvider } from "./EventFormContext"; 
export default function CreateEventLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventFormProvider>
      {children}
    </EventFormProvider>
  );
}