# 03 — JWT Auth with Roles

## Statement
Build a minimal auth flow in Express:
- `POST /login` accepts username/password and returns JWT.
- Protected route requires valid JWT (`requireAuth`).
- Admin route requires role `admin` (`requireRole("admin")`).

Use `user` and `admin` roles.

You can hardcode users in memory for simplicity.

## Requirements
- TypeScript + Express.
- `jsonwebtoken`-style sign/verify code (real lib or pseudocode wrapper).
- Middlewares:
  - `requireAuth`
  - `requireRole(role)`
- Return `401` for missing/invalid token.
- Return `403` for valid token but insufficient role.

## Time box
40-55 minutes

## What interviewers look for (Что ищут)
- Понимание различий `401` vs `403`.
- Умение декомпозировать auth и authorization middleware.
- Аккуратная работа с типами payload и `req.user`.
- Базовая security-гигиена (секрет, срок жизни токена, без утечки паролей).

## Hints
- Добавь declaration merging для `Express.Request` c `user`.
- Токен обычно передается как `Authorization: Bearer <token>`.
- Проверяй, что схема заголовка корректная, до `verify`.
- В демо можно хранить пользователей в массиве.

## Reference solution — complete TypeScript (Express or plain Node)
```ts
import express, { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type Role = "user" | "admin";

type User = {
  id: string;
  username: string;
  password: string;
  role: Role;
};

type JwtPayload = {
  sub: string;
  role: Role;
  username: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const users: User[] = [
  { id: "1", username: "alice", password: "pass123", role: "user" },
  { id: "2", username: "bob", password: "admin123", role: "admin" },
];

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const app = express();
app.use(express.json());

app.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const payload: JwtPayload = { sub: user.id, role: user.role, username: user.username };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  return res.json({ accessToken: token, tokenType: "Bearer" });
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization");
  if (!auth) return res.status(401).json({ error: "Missing Authorization header" });

  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid Authorization format" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}

app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get("/admin", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ secret: "admin-only data" });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

## Follow-up questions
- Как реализовать refresh tokens и logout?
- Где хранить токен на фронтенде безопаснее и почему?
- Как сделать role hierarchy (`super-admin` > `admin`)?
- Какие дополнительные claims стоит добавить в JWT?
