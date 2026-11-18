import raw from "./events.json";

export interface FormField {
  kind: "name" | "text" | "email" | "phone" | "textarea" | "date" | "checkbox" | "radio" | "select";
  name?: string;
  label: string;
  required?: boolean;
  choices?: string[];
  namePart?: "first" | "last";
}

export interface Repeater {
  max: number;
  addLabel: string;
  removeLabel: string;
  fields: FormField[];
}

export interface EventForm {
  id: string;
  formKey: string;
  event: string;
  page: string;
  anchor: string;
  button: string;
  open: boolean;
  success: { type: "message"; message: string } | { type: "redirect"; path: string };
  fields: FormField[];
  repeater: Repeater | null;
}

export const events: readonly EventForm[] = raw as EventForm[];

export function eventById(id: string): EventForm | undefined {
  return events.find((item) => item.id === id);
}
