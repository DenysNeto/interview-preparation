# Shopping Cart with `useReducer` + Context

## Statement
Build a shopping cart state manager in React + TypeScript using `useReducer` and Context.

Actions:
- `ADD`
- `REMOVE`
- `SET_QTY`
- `CLEAR`

Show derived cart total.

## Requirements
- React 18+ hooks and TypeScript.
- State should store cart lines with quantity.
- `ADD`:
  - if item exists, increment quantity
  - else add with qty = 1
- `REMOVE` removes line by id.
- `SET_QTY` updates quantity (remove if qty <= 0).
- `CLEAR` empties cart.
- Expose state + dispatch via context hooks.

## Time box
40-50 minutes

## What interviewers look for (Что ищут)
- Умение использовать `useReducer` для предсказуемого state-flow.
- Четкие типы action-ов (discriminated union).
- Корректные immutable обновления коллекции.
- Derived state (`total`) без дублирования данных.
- Понятный контекст API (`useCart` hook).

## Hints
> - Сделай `type CartAction = ...` через union.
> - Храни в линии `id`, `title`, `price`, `qty`.
> - `total` удобно вычислять в `useMemo` в провайдере.
> - Добавь guard в `useCart`, если контекст не найден.

## Reference solution
```tsx
import React, { createContext, useContext, useMemo, useReducer } from "react";

type Product = {
  id: string;
  title: string;
  price: number;
};

type CartLine = Product & {
  qty: number;
};

type CartState = {
  lines: CartLine[];
};

type CartAction =
  | { type: "ADD"; payload: Product }
  | { type: "REMOVE"; payload: { id: string } }
  | { type: "SET_QTY"; payload: { id: string; qty: number } }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.lines.find((l) => l.id === action.payload.id);
      if (existing) {
        return {
          lines: state.lines.map((l) =>
            l.id === action.payload.id ? { ...l, qty: l.qty + 1 } : l
          ),
        };
      }
      return { lines: [...state.lines, { ...action.payload, qty: 1 }] };
    }
    case "REMOVE":
      return { lines: state.lines.filter((l) => l.id !== action.payload.id) };
    case "SET_QTY":
      if (action.payload.qty <= 0) {
        return { lines: state.lines.filter((l) => l.id !== action.payload.id) };
      }
      return {
        lines: state.lines.map((l) =>
          l.id === action.payload.id ? { ...l, qty: action.payload.qty } : l
        ),
      };
    case "CLEAR":
      return { lines: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] });
  const total = useMemo(
    () => state.lines.reduce((sum, line) => sum + line.price * line.qty, 0),
    [state.lines]
  );

  return (
    <CartContext.Provider value={{ state, dispatch, total }}>{children}</CartContext.Provider>
  );
}

function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

const PRODUCTS: Product[] = [
  { id: "p1", title: "Keyboard", price: 90 },
  { id: "p2", title: "Mouse", price: 45 },
  { id: "p3", title: "Monitor", price: 220 },
];

function Catalog() {
  const { dispatch } = useCart();
  return (
    <section>
      <h2>Catalog</h2>
      {PRODUCTS.map((p) => (
        <div key={p.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <span>
            {p.title} - ${p.price}
          </span>
          <button onClick={() => dispatch({ type: "ADD", payload: p })}>Add</button>
        </div>
      ))}
    </section>
  );
}

function CartView() {
  const { state, dispatch, total } = useCart();
  return (
    <section>
      <h2>Cart</h2>
      {state.lines.length === 0 ? <p>Cart is empty</p> : null}
      {state.lines.map((line) => (
        <div key={line.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <strong>{line.title}</strong>
          <input
            type="number"
            min={0}
            value={line.qty}
            onChange={(e) =>
              dispatch({
                type: "SET_QTY",
                payload: { id: line.id, qty: Number(e.target.value) },
              })
            }
            style={{ width: 64 }}
          />
          <span>${line.price * line.qty}</span>
          <button onClick={() => dispatch({ type: "REMOVE", payload: { id: line.id } })}>
            Remove
          </button>
        </div>
      ))}
      <p>Total: ${total.toFixed(2)}</p>
      <button onClick={() => dispatch({ type: "CLEAR" })}>Clear</button>
    </section>
  );
}

export default function ShoppingCartApp() {
  return (
    <CartProvider>
      <main style={{ maxWidth: 680, margin: "24px auto", fontFamily: "sans-serif" }}>
        <h1>Shopping Cart</h1>
        <Catalog />
        <hr />
        <CartView />
      </main>
    </CartProvider>
  );
}
```

## Follow-up questions
- How would you persist cart to localStorage?
- Как добавить промокоды и скидки без усложнения reducer?
- When would Zustand/Redux be better than Context + reducer?
- Как избежать лишних ререндеров дочерних компонентов?
