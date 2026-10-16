# Notes App (Next.js Full-Stack Mini)

## Statement
Build a minimal Notes app in Next.js (App Router) with a simple UI and API route handlers (or server actions). The app should support CRUD for notes stored in memory.

## Requirements
- Use Next.js + TypeScript.
- Store notes in an in-memory array (no DB).
- Implement CRUD:
  - Create note (`title`, optional `content`)
  - Read list of notes
  - Update note
  - Delete note
- Validate input (title required, min length, max length).
- Show validation errors in the UI.
- Keep the solution simple and runnable.

## Time box
~60 minutes

## What interviewers look for (Что ищут)
- Умение быстро собрать end-to-end фичу: UI + API.
- Чистое разделение ответственности (route handlers, store, validation).
- Базовую обработку ошибок и валидацию входных данных.
- Понимание ограничений in-memory хранилища.

## Hints
- Создай `lib/store.ts` с массивом заметок и helper-функциями.
- Для валидации можно использовать простую ручную функцию.
- После мутаций обновляй список через повторный fetch.

## Reference solution — complete TypeScript
```ts
// app/lib/notes-store.ts
export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

const notes: Note[] = [];

export function listNotes(): Note[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createNote(input: { title: string; content?: string }): Note {
  const now = Date.now();
  const note: Note = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content ?? "",
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  return note;
}

export function updateNote(
  id: string,
  input: { title?: string; content?: string }
): Note | null {
  const note = notes.find((n) => n.id === id);
  if (!note) return null;
  if (input.title !== undefined) note.title = input.title;
  if (input.content !== undefined) note.content = input.content;
  note.updatedAt = Date.now();
  return note;
}

export function deleteNote(id: string): boolean {
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return false;
  notes.splice(index, 1);
  return true;
}
```

```ts
// app/lib/validation.ts
export type NoteInput = {
  title?: unknown;
  content?: unknown;
};

export function validateNoteInput(input: NoteInput): {
  ok: boolean;
  errors: string[];
  data?: { title: string; content: string };
} {
  const errors: string[] = [];
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content =
    typeof input.content === "string" ? input.content.trim() : "";

  if (!title) errors.push("Title is required.");
  if (title.length > 80) errors.push("Title must be <= 80 characters.");
  if (content.length > 500) errors.push("Content must be <= 500 characters.");

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], data: { title, content } };
}
```

```ts
// app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createNote, listNotes } from "@/app/lib/notes-store";
import { validateNoteInput } from "@/app/lib/validation";

export async function GET() {
  return NextResponse.json({ notes: listNotes() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = validateNoteInput(body);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }
  const note = createNote(validation.data!);
  return NextResponse.json({ note }, { status: 201 });
}
```

```ts
// app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deleteNote, updateNote } from "@/app/lib/notes-store";
import { validateNoteInput } from "@/app/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const validation = validateNoteInput(body);
  if (!validation.ok) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }
  const updated = updateNote(id, validation.data!);
  if (!updated) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }
  return NextResponse.json({ note: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = deleteNote(id);
  if (!ok) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
```

```tsx
// app/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    const response = await fetch("/api/notes");
    const data = await response.json();
    setNotes(data.notes);
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.errors ?? ["Failed to create note"]);
        return;
      }
      setTitle("");
      setContent("");
      await loadNotes();
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await loadNotes();
  };

  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Notes</h1>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create note"}
        </button>
      </form>

      {errors.length > 0 && (
        <ul>
          {errors.map((err) => (
            <li key={err} style={{ color: "crimson" }}>
              {err}
            </li>
          ))}
        </ul>
      )}

      <ul style={{ marginTop: 20 }}>
        {notes.map((note) => (
          <li key={note.id} style={{ marginBottom: 12 }}>
            <strong>{note.title}</strong>
            <div>{note.content}</div>
            <button onClick={() => void onDelete(note.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

## Follow-up questions
- Как бы ты заменил in-memory store на PostgreSQL/Prisma?
- Как реализовать optimistic updates и rollback в UI?
- Какие race conditions возможны при одновременном редактировании заметки?
