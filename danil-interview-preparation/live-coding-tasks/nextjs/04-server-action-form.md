# Server Action Form with Revalidation

## Statement
Build a notes page where users can create notes via a Server Action:
- Implement `createNote` Server Action.
- Validate form data on the server.
- Call `revalidatePath` after successful create.
- Use a client form with `useActionState` (or `useFormState`) to show result/errors.

## Requirements
- Keep mutation logic in a Server Action (`'use server'` file).
- Use a Client Component form for interaction and pending/error/success UI.
- Revalidate notes page after successful create.
- Return typed state from action.
- Show created notes on the page.

## Time box
40-50 minutes

## What interviewers look for (Что ищут)
- Понимание современного паттерна Server Actions в App Router.
- Умение разделить server mutation и client interactivity.
- Корректное использование `revalidatePath`.
- Аккуратную обработку ошибок в action state.
- Понимание, почему валидация обязана быть на сервере.

## Hints
- Action должна принимать `(prevState, formData)`.
- В Client Component можно использовать `useActionState` для состояния ответа.
- После успешного создания вызывай `revalidatePath("/notes")`.

## Reference solution — App Router TypeScript code (show file paths as comments)
```ts
// lib/notes-store.ts
export type Note = {
  id: number;
  text: string;
};

const notes: Note[] = [
  { id: 1, text: "Read App Router docs" },
  { id: 2, text: "Practice Server Actions" },
];

export async function listNotes(): Promise<Note[]> {
  return notes;
}

export async function insertNote(text: string): Promise<Note> {
  const newNote: Note = {
    id: notes.length + 1,
    text,
  };
  notes.push(newNote);
  return newNote;
}
```

```ts
// app/notes/actions.ts
'use server';

import { revalidatePath } from "next/cache";
import { insertNote } from "@/lib/notes-store";

export type CreateNoteState = {
  success: boolean;
  message: string;
};

export async function createNote(
  _prevState: CreateNoteState,
  formData: FormData,
): Promise<CreateNoteState> {
  const rawText = formData.get("text");
  const text = typeof rawText === "string" ? rawText.trim() : "";

  if (text.length < 3) {
    return {
      success: false,
      message: "Note must contain at least 3 characters.",
    };
  }

  await insertNote(text);
  revalidatePath("/notes");

  return {
    success: true,
    message: "Note created successfully.",
  };
}
```

```tsx
// app/notes/NewNoteForm.tsx
'use client';

import { useActionState } from "react";
import { createNote, type CreateNoteState } from "./actions";

const initialState: CreateNoteState = {
  success: false,
  message: "",
};

export function NewNoteForm() {
  const [state, formAction, isPending] = useActionState(createNote, initialState);

  return (
    <form action={formAction} style={{ marginBottom: 24 }}>
      <label htmlFor="text">New note</label>
      <br />
      <input
        id="text"
        name="text"
        type="text"
        placeholder="Write a note..."
        disabled={isPending}
      />
      <button type="submit" disabled={isPending} style={{ marginLeft: 8 }}>
        {isPending ? "Creating..." : "Create"}
      </button>
      {state.message ? (
        <p style={{ color: state.success ? "green" : "crimson" }}>{state.message}</p>
      ) : null}
    </form>
  );
}
```

```tsx
// app/notes/page.tsx
import { listNotes } from "@/lib/notes-store";
import { NewNoteForm } from "./NewNoteForm";

export default async function NotesPage() {
  const notes = await listNotes();

  return (
    <main style={{ padding: 24 }}>
      <h1>Notes</h1>
      <NewNoteForm />

      <ul>
        {notes.map((note) => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
    </main>
  );
}
```

## Follow-up questions
- Когда лучше выбрать Route Handler вместо Server Action?
- Почему клиентская валидация не может заменить серверную?
- Как избежать повторной отправки формы при медленном интернете?
- Что изменится, если данные лежат в реальной БД (Prisma/Drizzle)?
