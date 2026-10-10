# JavaScript Interview Study Guide: HTML, CSS, and Accessibility

Concise, answer-first explanations you can say aloud in an interview. Use the examples when the interviewer asks you to go deeper.

---

## Semantic HTML and Document Structure

### What is semantic HTML, and why does it matter?

Use elements for **meaning**, not only for how they look. The browser, crawlers, and assistive tech get a real outline instead of a pile of `div`s.

Landmark / structure: `header`, `nav`, `main` (one per page), `aside`, `footer`, `section`, `article`.  
Text: `h1`–`h6` in order (do not skip for styling), `p`, `blockquote`, `pre`, `code`.  
Lists: `ul` / `ol` / `li`, `dl` / `dt` / `dd`.  
Other: `button` vs `a`, `figure` / `figcaption`, `time`, `address`, `table` with `th`/`caption`/`scope`.

```html
<body>
  <header>
    <nav aria-label="Primary">...</nav>
  </header>
  <main>
    <article>
      <h1>Title</h1>
      <p>...</p>
    </article>
  </main>
  <footer>...</footer>
</body>
```

A `div` / `span` has **no** role. CSS can make a `div` look like a button; it will not get keyboard activation or a button role unless you rebuild that yourself — prefer the real tag.

`<html lang="en">` (or the real language) matters for screen readers and hyphenation.

---



## Forms, `label`, `button`, `input`, Native Validation



### How should a form be wired for accessibility and validation?

Every control needs a **programmatic name**. The reliable way is a `<label>` whose `for` matches the control `id` (or wrap the control in the label).

```html
<form>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required autocomplete="email" />

  <fieldset>
    <legend>Plan</legend>
    <label><input type="radio" name="plan" value="free" /> Free</label>
    <label><input type="radio" name="plan" value="pro" /> Pro</label>
  </fieldset>

  <button type="submit">Save</button>
</form>
```

`button`

- `type="submit"` is the default **inside a form**. A button in a form without `type` will submit — set `type="button"` for JS-only actions.
- Prefer `<button>` over `<div onclick>` or `<a href="#">` for actions. Links **navigate**; buttons **do**.

`input` **types** that help mobile keyboards and validation: `email`, `url`, `tel`, `number`, `search`, `date`, `password`. Use `autocomplete` tokens (`name`, `email`, `current-password`) — browsers and password managers depend on them.

**Native validation** (Constraint Validation API):

- Attributes: `required`, `min`/`max`/`step`, `minlength`/`maxlength`, `pattern`, `type`
- JS: `input.checkValidity()`, `setCustomValidity("...")`, `reportValidity()`, `form.noValidate` to skip native bubbles and show your own UI
- CSS: `:valid`, `:invalid`, `:user-valid` / `:user-invalid` (after interaction, better than styling `:invalid` on first paint)
- Always **repeat checks on the server**. Native HTML is UX, not security.

`aria-invalid="true"` and `aria-describedby` pointing at an error message when you replace native bubbles.

`placeholder` is not a label. It disappears and is often low contrast.

---



## Accessibility: Keyboard, Focus, ARIA, Screen Readers



### What do you actually guarantee for keyboard users?

- All interactive controls are reachable with **Tab** / **Shift+Tab** (logical order ≈ visual order; avoid positive `tabindex`)
- **Enter** / **Space** activate buttons; links activate with Enter
- Focus is **visible** (`:focus-visible` so mouse users are not forced into a fat ring)
- Modals: **focus trap**, initial focus inside, restore focus on close, **Escape** closes
- Do not `outline: none` without a replacement
- `tabindex="0"` adds an element to the tab order; `tabindex="-1"` makes it focusable only from script (skip links, dialogs)

Skip link as first focusable control: “Skip to main content” → `#main`.

### What is ARIA, and when do you use it?

ARIA **names, roles, and states** for AT when HTML is not enough. First rule: **don’t use ARIA if a native element exists.**

- **Role** — what it is (`role="dialog"`). Native `button` already has a role.
- **Name** — accessible name: label, `aria-label`, `aria-labelledby`, text content, `alt`
- **State/value** — `aria-expanded`, `aria-checked`, `aria-disabled`, `aria-hidden`, `aria-live`

```html
<button type="button" aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" hidden>...</ul>
```

`aria-hidden="true"` hides from AT (and must not sit on a focusable node). `display: none` / `hidden` hide from everyone.

**Live regions:** `aria-live="polite"` (or `role="status"`) for toasts; `assertive` / `role="alert"` for errors. Don’t spam.

**Accessible name computation** (interview favorite): `aria-labelledby` > `aria-label` > native `<label>` / `alt` / nested text. Empty `alt=""` on decorative images; never omit `alt` on meaningful images.

Screen readers walk the **accessibility tree** (browser-derived from DOM + ARIA). They announce role, name, state. Test with VoiceOver / NVDA, not only Lighthouse.

#### Простыми словами: что такое ARIA и зачем она

**ARIA** (Accessible Rich Internet Applications) — атрибуты, которые объясняют вспомогательным технологиям то, чего не видно из голого HTML. Скринридер не «смотрит» на пиксели. Браузер строит **дерево доступности** и отдаёт ему роль, имя и состояние. ARIA дополняет это дерево, когда обычного тега мало.

Кастомный блок, который выглядит как кнопка:

```html
<div>Menu</div>
```

Для скринридера это просто текст. Он не знает, что по нему можно нажать, что это кнопка и открыто ли меню. ARIA может это дописать:

```html
<div role="button" tabindex="0" aria-expanded="false" aria-controls="menu">
  Menu
</div>
```

Объявление будет примерно: «Menu, button, collapsed». Но ARIA **не добавляет поведение**. Клик, `Enter` / `Space`, фокус и смену `aria-expanded` всё равно пишете вы.

Поэтому сначала нативный тег. У `<button>` уже есть роль, фокус и клавиатура; ARIA нужна только на недостающее состояние:

```html
<button type="button" aria-expanded="false" aria-controls="menu">Menu</button>
```

Правило: **если есть подходящий HTML-элемент, не подменяйте его ARIA.** Не пишите `<button role="button">`.

**Role** — что это (`role="dialog"`). **Name** — как называется. **State** — в каком состоянии (`aria-expanded`, `aria-checked`, `aria-selected`, `aria-invalid`).

Имя лучше брать из видимого текста. Если его нет, например на кнопке-иконке:

```html
<button type="button" aria-label="Close"><svg>...</svg></button>
```

Если заголовок уже есть на странице, не дублируйте строку, а сошлитесь на него:

```html
<h2 id="dialog-title">Delete account?</h2>
<div role="dialog" aria-labelledby="dialog-title">...</div>
```

Порядок имени: видимый текст / `<label>` → `aria-labelledby` → `aria-label`.

`aria-disabled="true"` только **сообщает** «недоступно». Кнопку оно не выключает. Для настоящей кнопки ставьте атрибут `disabled`.

`aria-hidden="true"` прячет узел от дерева доступности, но оставляет его на экране — для декоративной иконки. `hidden` и `display: none` прячут и от глаз, и от скринридера. Не вешайте `aria-hidden` на элемент, который всё ещё получает фокус: клавиатура на него попадёт, а скринридер промолчит.

Если текст появился без перезагрузки, скринридер может его не заметить. Для этого live region:

```html
<div role="status" aria-live="polite">Profile saved</div>
<div role="alert">Payment failed</div>
```

`polite` / `role="status"` — сказать, когда речь освободится (сохранено, результаты загрузились). `role="alert"` — срочная ошибка, перебивает. Не ставьте alert на каждый тост, иначе скринридер будет постоянно перебивать.

ARIA нужна для вкладок, диалогов, combobox, меню и уведомлений, у которых нет одного готового тега. Не нужна для `<button>`, `<a href>`, `<input>` и `<nav>`: роль и поведение уже есть.

**На собесе:** ARIA дописывает дереву доступности роль, имя и состояние. Она не заменяет семантический HTML и не включает клавиатуру. Сначала нативный элемент, ARIA — только то, чего в теге нет.

#### Список `aria-*` атрибутов

`role` — не `aria-*`, но часть той же модели: говорит, **что** это за элемент (`button`, `dialog`, `tab`). Атрибуты ниже говорят **как называется**, **в каком состоянии** и **с чем связан**.

Список по [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) (рекомендация W3C, июнь 2023). Не все атрибуты можно вешать на любой тег: у роли есть свой набор.

**Имя и описание**


| Атрибут                       | Зачем                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| `aria-label`                  | Имя строкой, когда видимого текста нет (кнопка-иконка)                               |
| `aria-labelledby`             | Имя из текста другого элемента по `id`                                               |
| `aria-describedby`            | Дополнение к имени: подсказка, формат, текст ошибки                                  |
| `aria-description`            | То же текстом, без отдельного элемента (поддержка слабее, чем у `describedby`)       |
| `aria-details`                | Ссылка на развёрнутое описание, не краткая подсказка                                 |
| `aria-roledescription`        | Своё слово вместо стандартной роли («Звезда» вместо `slider`). Редко и осторожно     |
| `aria-braillelabel`           | Отдельное имя для брайля, если обычное слишком длинное. ARIA 1.3, не базовый минимум |
| `aria-brailleroledescription` | Описание роли для брайля. Тоже ARIA 1.3                                              |


**Состояние виджета**


| Атрибут                | Зачем                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| `aria-checked`         | `true` / `false` / `mixed` у checkbox, radio, switch, пункта меню            |
| `aria-pressed`         | Кнопка-переключатель нажата или нет                                          |
| `aria-expanded`        | Раскрыто ли то, чем управляет кнопка (меню, аккордеон)                       |
| `aria-selected`        | Выбран пункт tab, option, row                                                |
| `aria-disabled`        | Сообщить «недоступно». Сам клик не блокирует — для кнопки нужен `disabled`   |
| `aria-hidden`          | Убрать из дерева доступности, на экране оставить. Не на фокусируемом узле    |
| `aria-invalid`         | Поле с ошибкой: `true` или `grammar` / `spelling`                            |
| `aria-required`        | Обязательное поле, если нет нативного `required`                             |
| `aria-readonly`        | Можно смотреть, нельзя менять                                                |
| `aria-placeholder`     | Подсказка пустого поля. Не замена `<label>`                                  |
| `aria-busy`            | Область обновляется, скринридеру лучше подождать                             |
| `aria-current`         | Текущий пункт: `page`, `step`, `location`, `date`, `time`, `true`            |
| `aria-haspopup`        | По активации откроется меню, dialog, listbox, tree, grid                     |
| `aria-modal`           | `true` на dialog: остальная страница для AT недоступна, пока диалог открыт   |
| `aria-autocomplete`    | Как дополняется ввод: `none`, `inline`, `list`, `both`                       |
| `aria-multiline`       | Поле на несколько строк                                                      |
| `aria-multiselectable` | В списке или гриде можно выбрать несколько                                   |
| `aria-orientation`     | `horizontal` или `vertical` у slider, tablist, separator                     |
| `aria-sort`            | Сортировка колонки: `ascending`, `descending`, `none`, `other`               |
| `aria-level`           | Уровень в дереве или у заголовка                                             |
| `aria-keyshortcuts`    | Какие клавиши вызывают действие (`Alt+S`). Не назначает их, только объявляет |


**Числовые виджеты** (`slider`, `spinbutton`, `meter`, `progressbar`, `scrollbar`)


| Атрибут          | Зачем                                     |
| ---------------- | ----------------------------------------- |
| `aria-valuenow`  | Текущее число                             |
| `aria-valuemin`  | Минимум                                   |
| `aria-valuemax`  | Максимум                                  |
| `aria-valuetext` | Текст вместо числа («половина», «громко») |


**Связи между элементами**


| Атрибут                 | Зачем                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| `aria-controls`         | Этот элемент управляет другим (`id` меню или панели)                           |
| `aria-owns`             | Дочерний в дереве доступности, хотя в DOM он не внутри                         |
| `aria-activedescendant` | Какой потомок сейчас активен, фокус остаётся на контейнере (listbox, combobox) |
| `aria-flowto`           | Куда логично перейти дальше, не по порядку DOM                                 |
| `aria-errormessage`     | `id` текста ошибки. Имеет смысл вместе с `aria-invalid="true"`                 |
| `aria-posinset`         | Позиция в наборе, если не все элементы в DOM (виртуальный список)              |
| `aria-setsize`          | Сколько всего элементов в этом наборе                                          |


**Таблица и grid**


| Атрибут             | Зачем                                 |
| ------------------- | ------------------------------------- |
| `aria-rowcount`     | Число строк, включая те, что не в DOM |
| `aria-rowindex`     | Индекс строки                         |
| `aria-rowindextext` | Текст вместо номера строки            |
| `aria-rowspan`      | На сколько строк растянута ячейка     |
| `aria-colcount`     | Число колонок                         |
| `aria-colindex`     | Индекс колонки                        |
| `aria-colindextext` | Текст вместо номера колонки           |
| `aria-colspan`      | На сколько колонок растянута ячейка   |


**Живые области**


| Атрибут         | Зачем                                                             |
| --------------- | ----------------------------------------------------------------- |
| `aria-live`     | `off`, `polite` (когда освободится речь), `assertive` (перебить)  |
| `aria-atomic`   | `true` — прочитать весь регион, не только изменившийся кусок      |
| `aria-relevant` | Какие изменения объявлять: `additions`, `removals`, `text`, `all` |


**Устарели, не используйте**


| Атрибут           | Почему                                       |
| ----------------- | -------------------------------------------- |
| `aria-grabbed`    | Старый drag-and-drop. В ARIA 1.1+ deprecated |
| `aria-dropeffect` | Куда можно бросить. Тоже deprecated          |


На собесе не нужно перечислять все сорок. Достаточно групп: **имя** (`label` / `labelledby` / `describedby`), **состояние** (`expanded`, `checked`, `selected`, `invalid`, `hidden`), **связь** (`controls`, `activedescendant`, `errormessage`), **live** (`live`, `atomic`). Остальное — когда строите grid, tree или slider без нативного тега.

---



- Tools: axe / Lighthouse a11y, keyboard-only pass,

---



## Box Model and `box-sizing`



### How does the CSS box model work?

For a box: **content → padding → border → margin**.

- `content-box` (default in the spec): `width` / `height` size **content only**. Padding and border add **outside**, so the visual size is larger than `width`.
- `border-box`**:** `width` includes content + padding + border. Layout math matches the mock. Almost every codebase sets:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

Margin **collapses** between adjoining vertical margins of in-flow block boxes (parent/child and siblings), not for flex/grid items in the usual way, and not if overflow/padding/border prevents it.

`width: 100%` + `padding` with `content-box` overflows the parent — a classic interview trap.

---



## `display`, `position`, and the Containing Block



### How do `display` and `position` change layout?

`display` (two-value in modern CSS: outer + inner, e.g. `block flex`):

- `block` — fills the row, breaks before/after
- `inline` — flows with text; vertical `margin`/`padding` don’t do what people expect for spacing between lines
- `inline-block` — inline flow, but width/height apply
- `none` — removed from layout and a11y tree
- `flex` / `grid` / `table` — formatting context for children
- `contents` — the element’s box is skipped; children “promote” (a11y pitfalls)

`position`

- `static` — default; `top`/`z-index` do nothing
- `relative` — in flow; `top`/`left` offset **itself**; is a containing block for `absolute` children
- `absolute` — out of flow; positioned against the **containing block**
- `fixed` — usually vs the **viewport** (unless an ancestor has `transform` / `filter` / `perspective` / `contain` / `will-change` — then that ancestor)
- `sticky` — in flow until a threshold; then sticks inside its **scroll ancestor** (the ancestor must be the scroll container; `overflow: hidden` on a parent often kills sticky)

**Containing block** for `absolute`: nearest ancestor with `position` not `static` (or certain transforms). Percentage `height`/`top` resolve against that box. If everything is `static`, it is the initial containing block (viewport-related).

---



## Flexbox and Grid



### When do you use Flexbox vs Grid?

**Flexbox** — **one-dimensional** (a row **or** a column): toolbars, nav, splitting leftover space, aligning a label and a control.

```css
.row {
  display: flex;
  align-items: center;      /* cross axis */
  justify-content: space-between; /* main axis */
  gap: 1rem;
}
.item { flex: 1 1 0; }      /* grow | shrink | basis */
```

`flex: 1` ≈ `1 1 0%` in many browsers’ interpretation via `flex: 1 1 0`; know `flex-grow`, `flex-shrink`, `flex-basis`. `min-width: auto` on flex items can prevent shrinking below content — `min-width: 0` on the item (or the grid child) is the overflow fix.

**Grid** — **two-dimensional**: rows **and** columns together (page layout, card galleries, forms with aligned labels).

```css
.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}
.header { grid-column: 1 / -1; }
```

`fr`, `minmax(0, 1fr)`, `auto-fit` / `auto-fill` + `minmax(16rem, 1fr)` for responsive cards **without** a breakpoint per column count. `subgrid` (where supported) aligns nested tracks to the parent.

You can **nest** them: grid for the page, flex for the header contents.

---



## Responsive Design, Media Queries, Container Queries



### How do you make a UI that works across viewports?

**Responsive** — one layout that **flexes** (fluid widths, wrapping, breakpoints).  
**Adaptive** — often means distinct layouts per bucket (sometimes separate templates). Interviews usually want **responsive + mobile-first**.

Ingredients:

- Viewport meta: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Fluid images: `max-width: 100%; height: auto`
- Relative units: `rem` for type, `%` / `fr` / `svh` for layout; `clamp(1rem, 2vw, 1.5rem)` for fluid type
- **Media queries** — viewport (or system prefs):

```css
.sidebar { display: none; }

@media (min-width: 48rem) {
  .sidebar { display: block; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none; }
}
```

Mobile-first: base = small screen; `min-width` adds complexity.

- **Container queries** — based on a **parent container**, not the viewport. A card can go horizontal inside a wide column and stack in a narrow one, even on a large monitor.

```css
.card-grid {
  container-type: inline-size;
}
@container (min-width: 20rem) {
  .card { display: flex; }
}
```

`container-type: inline-size` (size queries). Combine with `@container` name if several containers nest.

---



## Cascade, Specificity, and Inheritance



### How does the browser decide which CSS wins?

In order:

1. **Origin and importance** — user-agent → user → author. Then `!important` reverses layers (author `!important` beats author normal, but user `!important` can beat author). **Cascade layers** (`@layer`) sit in here so design-system base can lose to app CSS without specificity wars.
2. **Specificity** of the selector (if origin/layer/importance tie).
3. **Source order** — last wins.

**Specificity** (a, b, c) roughly:

- inline `style=""` — extra bucket above IDs (treat as 1,0,0,0)
- **IDs** — (1, 0, 0)
- **classes, attributes, pseudo-classes** — (0, 1, 0)
- **elements, pseudo-elements** — (0, 0, 1)
- `*`, `:where()`, combinators — 0
- `:is()` / `:not()` — specificity of their **most specific** argument
- `:where()` — **zero** specificity (useful for resets)

```css
#nav .item { }     /* 1, 1, 0 */
button:hover { }   /* 0, 1, 1 */
```

**Inheritance:** `color`, `font-`*, `line-height` inherit. `margin`, `padding`, `border`, `display` do **not**. `inherit` / `initial` / `unset` / `revert` / `revert-layer` force it.

`!important` is a last resort; prefer lower-specificity defaults + layers + source order.

---



## Stacking Context and `z-index`



### Why does `z-index: 9999` sometimes still sit under another element?

`z-index` only compares elements that share a **stacking context**. A child cannot paint above an uncle that belongs to a **higher** sibling context, no matter how large the child’s `z-index` is.

A new stacking context is created by, among others:

- `position` not `static` **and** `z-index` not `auto`
- `opacity` < 1
- `transform`, `filter`, `perspective`, `clip-path`
- `isolation: isolate`
- `will-change` of some properties
- `fixed` / `sticky` in many cases
- `flex`/`grid` children with `z-index`

Painting order inside a context (simplified): background/border of the context → descendants with negative `z-index` → in-flow blocks → floats → in-flow inline → `z-index: auto` positioned → positive `z-index`.

For modals: create a **known** overlay root (`isolation` or a top-level portal) instead of inflating numbers.

---



## Pseudo-classes and Pseudo-elements



### What is the difference?

**Pseudo-class** (`:`) — **state or structural match** of an existing element: `:hover`, `:focus`, `:focus-visible`, `:focus-within`, `:checked`, `:disabled`, `:nth-child(2n)`, `:first-child`, `:not()`, `:has()`, `:empty`, `:user-invalid`.

**Pseudo-element** (`::`) — a **fake box** the engine generates: `::before`, `::after`, `::placeholder`, `::selection`, `::marker`, `::first-line`.

```css
button:focus-visible { outline: 2px solid; }

.quote::before {
  content: "“";
}
```

`::before` / `::after` need `content` (even `""`) to generate a box. They are **not** in the DOM for JS querySelector of real nodes the same way; some AT ignore decorative `content`. Don’t put required meaning only in `content:`.

`:has()` is a parent selector: `figure:has(figcaption) { }`.

---



## CSS Modules, CSS-in-JS, Utility-First CSS



### How do modern apps scope and ship styles?

**Global CSS / BEM** — naming conventions (`.card__title--muted`). Simple, cacheable, easy to debug in DevTools. Collision risk without discipline.

**CSS Modules** — each file exports **local class names** hashed at build (`styles.btn` → `Btn_btn_x3k9`). Composition via `composes`. Looks like CSS, scoped by default. Great default in SPA tooling.

**CSS-in-JS** (styled-components, Emotion, Panda, Linaria):

- Colocation with the component, props → styles
- Runtime versions inject a `<style>` tag (cost + FOUC/specificity issues); **zero-runtime** extracts CSS at build
- Dynamic theming is easy; critical CSS and duplication need care

**Utility-first** (Tailwind): small classes in markup (`flex gap-2 px-4`). Fast UI iteration, design tokens in config, purge/content scan for unused CSS. Markup can get noisy; extract components when patterns repeat. Same cascade rules still apply.

**Interview take:** there is no winner — talk **scoping, dead-code elimination, runtime cost, theming, and how you avoid 10-level specificity**. Native `@layer`, `@scope`, and shadow DOM are also scoping tools.

---



## Animations and `prefers-reduced-motion`



### How do CSS animations work, and what should you animate?

Two tools:

- `transition` — interpolate when a property **changes** (hover, class toggle). Good for color, opacity, transform.
- `animation` **+** `@keyframes` — a named sequence that can loop, delay, and alternate.

```css
.drawer {
  transform: translateX(100%);
  transition: transform 200ms ease-out;
}
.drawer.open {
  transform: translateX(0);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.toast {
  animation: fade-in 180ms ease-out both;
}
```

**Animate compositor-friendly properties:** `transform` and `opacity`. Animating `top` / `left` / `width` / `margin` causes **layout** (reflow) and often **paint** on every frame — jank, worse INP/CLS adjacent issues.

`will-change: transform` hints a layer; use it **during** the animation, not on every element forever (extra memory).

JS: `element.animate()`, Web Animations API, or `requestAnimationFrame` for values CSS cannot express. Keep work per frame small.

**Do not convey meaning only with motion** (a shake as the only error signal). Pair with text / `aria-invalid`.

### What is `prefers-reduced-motion`?

An OS-level preference (vestibular disorders, motion sensitivity). Honor it with a media query. WCAG: do not flash more than 3 times per second; large parallax / auto-playing motion should be optional.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Better than a global nuke when you can: **replace** motion with an instant state change, keep a short fade if it helps orientation, stop decorative loops (`animation: none` on carousels autoplay). In JS: `window.matchMedia("(prefers-reduced-motion: reduce)")` before `scrollIntoView({ behavior: "smooth" })` or Lottie.

Also respect `prefers-reduced-transparency` / `prefers-contrast` where you ship glassmorphism-heavy UI.

---



## Image and Font Optimization



### How do you ship images without wrecking LCP and bytes?

- **Right format:** photos → JPEG or **AVIF/WebP** with JPEG fallback; UI icons → SVG; screenshots with text → consider SVG or higher quality AVIF.
- **Right size:** `srcset` + `sizes` (or `<picture>` for art direction / format). Do not send a 3000px image into a 360px slot.
- **LCP image:** the hero/logo that is the largest paint. **Do not** `loading="lazy"` it. Use `fetchpriority="high"` and optionally `<link rel="preload" as="image">`. Width/height or `aspect-ratio` to avoid **CLS**.
- **Below the fold:** `loading="lazy"` + `decoding="async"`.
- **CDN**, compression, cache with hashed URLs.
- CSS background images are harder to `srcset`; prefer `<img>` for content images (a11y + `alt`).
- `content-visibility: auto` for long offscreen article images/sections.

```html
<img
  src="hero-800.avif"
  srcset="hero-400.avif 400w, hero-800.avif 800w, hero-1200.avif 1200w"
  sizes="(min-width: 60rem) 36rem, 100vw"
  width="800"
  height="450"
  alt="Product on a desk"
  fetchpriority="high"
/>
```



### How do you load web fonts without FOIT/FOUT disasters?

**FOIT** — invisible text while the font is missing. **FOUT** — fallback font, then a swap (can cause **CLS** if metrics differ).

- `font-display: swap` — show fallback fast (FOUT); good default for body text. `optional` — use the font only if it is already cached (great for repeat visits). `block` — longer invisible wait; usually avoid.
- **Subset** (latin / cyrillic) and serve **woff2**.
- **Preload** the one or two critical faces:

```html
<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
```

`crossorigin` is required for fonts even on same origin (anonymous CORS mode).

- Match fallback metrics: `size-adjust`, `ascent-override`, `descent-override` on a `@font-face` for the fallback so swap does not jump (CLS).
- `font-synthesis: none` if you do not want fake bold/italic.
- Self-host when you can (privacy, cache control) vs Google Fonts extra connection.
- Limit weights (one regular + one bold beats five files on first paint).

```css
@font-face {
  font-family: Inter;
  src: url("/fonts/inter-latin.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF;
}
```

Interview one-liner: **preload the LCP image and the body woff2; lazy-load the rest; never lazy-load the hero.**

---



## Must-Explain Questions



### `button` inside a `form` without `type` — what happens?

It is `submit`. Unintended submits are a common bug. Set `type="button"` for non-submit actions.

### Why is a `div` with `onClick` a bad button?

No keyboard (unless you add `tabindex`, `Enter`/`Space`, role, disabled semantics). Use `<button>`.

### Flex item won’t shrink / text won’t wrap?

`min-width: auto` (minimum of content size). Set `min-width: 0` (or `overflow: hidden`) on the flex/grid child.

### Fixed header sits under a `transform` parent?

`transform` on an ancestor makes it the containing block for `fixed`. The header sticks inside that box, not the viewport.

### `z-index` on a child of `opacity: 0.99`?

The opacity creates a stacking context. The child’s `z-index` is **capped** to that context’s layer in the parent.

### Media query vs container query?

Viewport vs **component’s container**. Use container queries when the same component appears in narrow and wide slots on one screen.

### Why not animate `left` or `width`?

Those properties trigger **layout** (and usually paint) every frame. `transform` and `opacity` can stay on the compositor.

### Why `loading="lazy"` on the hero is a bad idea?

The hero is often **LCP**. Lazy-loading delays the largest paint. Lazy-load **below-the-fold** images; preload / `fetchpriority="high"` the LCP one.

### `font-display: swap` vs `optional`?

`swap` shows fallback immediately (FOUT, possible CLS). `optional` uses the custom font only if it is ready in time — calmer first paint, maybe system font on slow 3G.