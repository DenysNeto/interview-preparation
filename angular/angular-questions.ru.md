# Вопросы по Angular

Перевод вопросов. Развёрнутые ответы на русском: [angular-study-plan.ru.md](angular-study-plan.ru.md). Короткие ответы на английском:

- [Angular Q&A](angular.md)
- [Сложные темы](tricky-angular-interview-topics.md) — [ответы](tricky-angular-interview-answers.md)

Термины Angular (`signal`, `OnPush`, `NgModule`, `pipe`) оставлены на английском: так их обычно и произносят.

---

## Компоненты и шаблоны

### What is an Angular component?

Что такое компонент Angular?

### What kinds of data binding exist?

Какие виды data binding есть в Angular?

---

## Standalone-компоненты и NgModules

### What changed with standalone components?

Что изменилось с появлением standalone-компонентов?

### What did NgModules do, and why do you still need to know them?

Что делали NgModule и зачем их всё ещё нужно знать?

---

## Inputs, outputs и двусторонняя привязка

### How do components communicate?

Как компоненты общаются между собой?

---

## Встроенный control flow и `@defer`

### What replaced `*ngIf` and `*ngFor`?

Что заменило `*ngIf` и `*ngFor`?

### What does `@defer` do?

Что делает `@defer`?

---

## Директивы

### What kinds of directives are there?

Какие виды директив бывают?

---

## Pipes

### What is a pipe, and what does "pure" mean?

Что такое pipe и что значит pure?

### What does the `async` pipe do?

Что делает `async` pipe?

---

## Проекция контента и шаблоны

### How do you pass markup into a component?

Как передать разметку внутрь компонента?

### What are `ng-template`, `ng-container`, and `ngTemplateOutlet`?

Что такое `ng-template`, `ng-container` и `ngTemplateOutlet`?

---

## View и content queries

### What's the difference between `viewChild` and `contentChild`?

В чём разница между `viewChild` и `contentChild`?

---

## Lifecycle-хуки

### What is the lifecycle order?

В каком порядке вызываются lifecycle-хуки?

### What are the modern alternatives?

Какие современные альтернативы lifecycle-хукам?

---

## Signals

### What are signals?

Что такое signals?

### Signals vs RxJS?

Чем signals отличаются от RxJS?

---

## Dependency injection

### How does DI work in Angular?

Как работает dependency injection в Angular?

### What does the injector hierarchy look like?

Как устроена иерархия инжекторов?

### What provider types exist?

Какие типы провайдеров бывают?

---

## Change detection

### How does Angular know when to update the view?

Как Angular понимает, что view пора обновить?

---

## Роутинг

### What are the core router features?

Какие основные возможности роутера?

---

## Формы

### Reactive forms vs template-driven forms?

Чем reactive forms отличаются от template-driven forms?

### How do you make a custom input work with forms?

Как заставить свой input работать с формами?

---

## HTTP

### How does `HttpClient` work?

Как работает `HttpClient`?

### What are interceptors for?

Для чего нужны interceptors?

---

## RxJS в Angular

### Where does Angular use RxJS?

Где Angular использует RxJS?

---

## Управление состоянием

### What are the options?

Какие варианты управления состоянием есть?

---

## Производительность

### What are the main levers?

Какие основные рычаги производительности?

---

## SSR и гидратация

### How does Angular SSR work?

Как работает SSR в Angular?

---

## Тестирование

### How do you test Angular code?

Как тестировать Angular-код?

---

## Безопасность

### How does Angular protect against XSS?

Как Angular защищает от XSS?

---

## Инструменты

### What does the Angular CLI give you?

Что даёт Angular CLI?

---

## Сложные вопросы

Те же темы, что в [чеклисте](tricky-angular-interview-topics.md), сформулированные как вопросы.

### Change detection

- Как работает change detection вместе с Zone.js?
- Что такое OnPush и в чём ловушка мутации объекта?
- Чем `markForCheck` отличается от `detectChanges` и `detach`?
- Почему возникает `ExpressionChangedAfterItHasBeenCheckedError`?
- Что такое zoneless change detection и на чём спотыкаются при миграции?
- Как выполнить код вне Angular через `NgZone`?
- Как Zone.js взаимодействует с нативным `async`/`await`?

### Signals

- Как equality у signals связана с иммутабельными обновлениями?
- Почему `computed` ленивый и как у него устроены динамические зависимости?
- Когда срабатывает `effect`, как устроен cleanup и когда его не стоит использовать?
- Что даёт `untracked` при чтении signal?
- Чем `linkedSignal` отличается от `computed` и `effect`?
- Чем signal inputs отличаются от `@Input` и `ngOnChanges`?
- Как устроены `model` и двусторонняя привязка?
- Как загружать асинхронные данные через `resource` и `httpResource`?
- Какие подводные камни у `toSignal` и `toObservable`?

### Dependency injection

- Чем element injector отличается от environment injector?
- Почему сервис иногда создаётся в нескольких экземплярах?
- Что делают модификаторы `self`, `skipSelf`, `host` и `optional`?
- Что такое `inject()` и injection context?
- Для чего `InjectionToken`, `useExisting` и multi-провайдеры?
- Чем `providers` отличаются от `viewProviders`?

### Компоненты, lifecycle и шаблоны

- Чем конструктор отличается от `ngOnInit`?
- В каком порядке идут lifecycle-хуки у родителя и детей?
- Когда доступен `viewChild` и что меняет `static: true`?
- Почему спроецированный контент всегда создаёт родитель?
- Чем `ng-template` отличается от `ng-container` и `ng-content`?
- Как устроен microsyntax структурных директив?
- Чем pure pipe отличается от impure?
- Почему `async` pipe может создать лишние подписки?
- Почему вызов функции в шаблоне — плохая идея?
- Зачем `track` в `@for`?
- Какие триггеры и ловушки у `@defer`?
- Как работают view encapsulation, `:host` и `::ng-deep`?
- Как создавать компоненты динамически?
- Как устроены host bindings и host listeners?

### RxJS и HTTP

- Когда в Angular-коде использовать `switchMap`, `mergeMap`, `concatMap` и `exhaustMap`?
- Как утекают подписки и куда ставить `takeUntilDestroyed`?
- Почему вложенные `subscribe` — проблема?
- Почему `HttpClient` cold и как `shareReplay` убирает повторные запросы?
- В каком порядке работают interceptors и зачем `HttpContext`?

### Роутер

- Чем `canMatch` отличается от `canActivate` и как это связано с lazy loading?
- Когда данные грузить в resolver, а когда в компоненте?
- Почему при переиспользовании роута `snapshot` params устаревают?

### Формы

- Как устроены типизированные reactive forms и disabled-контролы?
- Что такое `ControlValueAccessor`?
- Как работают async-валидаторы и `updateOn`?

### Управление состоянием

- Как в NgRx связаны actions, reducers, selectors и effects?
- Как обрабатывать ошибки в NgRx effects?
- Когда NgRx — лишнее?
- Что такое NgRx SignalStore?

### SSR, ошибки и безопасность

- Откуда берутся расхождения при гидратации и куда прятать browser-only код?
- Как устроена глобальная обработка ошибок через `ErrorHandler`?
- Как работает санитизация и что делает `bypassSecurityTrust`?

### Тестирование и производительность

- Как тестировать OnPush-компоненты?
- Чем `fakeAsync` и `tick` отличаются от тестов в zoneless?
- Как профилировать приложение в Angular DevTools?
- Как виртуализировать длинные списки через CDK?

### Общие вопросы

- Как мигрировать с NgModules на standalone, signals и zoneless?
- Чем Angular отличается от React?
