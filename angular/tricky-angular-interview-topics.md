# Tricky Angular Interview Topics

Spoken answers with examples: [tricky-angular-interview-answers.md](tricky-angular-interview-answers.md).

Вопросы на русском: [angular-questions.ru.md](angular-questions.ru.md).

## Change detection

- [ ] [Change detection with Zone.js](tricky-angular-interview-answers.md#change-detection-with-zonejs)
- [ ] [OnPush and the mutation trap](tricky-angular-interview-answers.md#onpush-and-the-mutation-trap)
- [ ] [markForCheck vs detectChanges vs detach](tricky-angular-interview-answers.md#markforcheck-vs-detectchanges-vs-detach)
- [ ] [ExpressionChangedAfterItHasBeenCheckedError](tricky-angular-interview-answers.md#expressionchangedafterithasbeencheckederror)
- [ ] [Zoneless change detection and migration traps](tricky-angular-interview-answers.md#zoneless-change-detection-and-migration-traps)
- [ ] [Running code outside Angular with NgZone](tricky-angular-interview-answers.md#running-code-outside-angular-with-ngzone)
- [ ] [Zone.js and native async/await](tricky-angular-interview-answers.md#zonejs-and-native-asyncawait)

## Signals

- [ ] [Signal equality and immutable updates](tricky-angular-interview-answers.md#signal-equality-and-immutable-updates)
- [ ] [computed laziness and dynamic dependencies](tricky-angular-interview-answers.md#computed-laziness-and-dynamic-dependencies)
- [ ] [effect timing, cleanup, and when not to use it](tricky-angular-interview-answers.md#effect-timing-cleanup-and-when-not-to-use-it)
- [ ] [untracked reads](tricky-angular-interview-answers.md#untracked-reads)
- [ ] [linkedSignal vs computed vs effect](tricky-angular-interview-answers.md#linkedsignal-vs-computed-vs-effect)
- [ ] [Signal inputs vs `@Input` and `ngOnChanges`](tricky-angular-interview-answers.md#signal-inputs-vs-input-and-ngonchanges)
- [ ] [model and two-way binding](tricky-angular-interview-answers.md#model-and-two-way-binding)
- [ ] [Async data with resource and httpResource](tricky-angular-interview-answers.md#async-data-with-resource-and-httpresource)
- [ ] [toSignal and toObservable pitfalls](tricky-angular-interview-answers.md#tosignal-and-toobservable-pitfalls)

## Dependency injection

- [ ] [Injector hierarchy: element vs environment injectors](tricky-angular-interview-answers.md#injector-hierarchy-element-vs-environment-injectors)
- [ ] [Accidental multiple service instances](tricky-angular-interview-answers.md#accidental-multiple-service-instances)
- [ ] [Resolution modifiers: self, skipSelf, host, optional](tricky-angular-interview-answers.md#resolution-modifiers-self-skipself-host-optional)
- [ ] [inject and the injection context](tricky-angular-interview-answers.md#inject-and-the-injection-context)
- [ ] [InjectionToken, useExisting, and multi providers](tricky-angular-interview-answers.md#injectiontoken-useexisting-and-multi-providers)
- [ ] [providers vs viewProviders](tricky-angular-interview-answers.md#providers-vs-viewproviders)

## Components, lifecycle, and templates

- [ ] [Constructor vs ngOnInit](tricky-angular-interview-answers.md#constructor-vs-ngoninit)
- [ ] [Lifecycle order with parents and children](tricky-angular-interview-answers.md#lifecycle-order-with-parents-and-children)
- [ ] [viewChild timing and static queries](tricky-angular-interview-answers.md#viewchild-timing-and-static-queries)
- [ ] [Content projection is always instantiated by the parent](tricky-angular-interview-answers.md#content-projection-is-always-instantiated-by-the-parent)
- [ ] [ng-template vs ng-container vs ng-content](tricky-angular-interview-answers.md#ng-template-vs-ng-container-vs-ng-content)
- [ ] [Structural directive microsyntax](tricky-angular-interview-answers.md#structural-directive-microsyntax)
- [ ] [Pure vs impure pipes](tricky-angular-interview-answers.md#pure-vs-impure-pipes)
- [ ] [The async pipe and duplicate subscriptions](tricky-angular-interview-answers.md#the-async-pipe-and-duplicate-subscriptions)
- [ ] [Function calls in templates](tricky-angular-interview-answers.md#function-calls-in-templates)
- [ ] [track in `@for`](tricky-angular-interview-answers.md#track-in-for)
- [ ] [`@defer` triggers and pitfalls](tricky-angular-interview-answers.md#defer-triggers-and-pitfalls)
- [ ] [View encapsulation, `:host`, and `::ng-deep`](tricky-angular-interview-answers.md#view-encapsulation-host-and-ng-deep)
- [ ] [Dynamic components](tricky-angular-interview-answers.md#dynamic-components)
- [ ] [Host bindings and listeners](tricky-angular-interview-answers.md#host-bindings-and-listeners)

## RxJS and HTTP

- [ ] [Flattening operators in Angular code](tricky-angular-interview-answers.md#flattening-operators-in-angular-code)
- [ ] [Subscription leaks and `takeUntilDestroyed` placement](tricky-angular-interview-answers.md#subscription-leaks-and-takeuntildestroyed-placement)
- [ ] [Nested subscribes](tricky-angular-interview-answers.md#nested-subscribes)
- [ ] [HttpClient is cold: duplicate requests and shareReplay](tricky-angular-interview-answers.md#httpclient-is-cold-duplicate-requests-and-sharereplay)
- [ ] [Interceptor order and HttpContext](tricky-angular-interview-answers.md#interceptor-order-and-httpcontext)

## Router

- [ ] [canMatch vs canActivate and lazy loading](tricky-angular-interview-answers.md#canmatch-vs-canactivate-and-lazy-loading)
- [ ] [Resolvers vs loading in the component](tricky-angular-interview-answers.md#resolvers-vs-loading-in-the-component)
- [ ] [Route reuse and stale snapshot params](tricky-angular-interview-answers.md#route-reuse-and-stale-snapshot-params)

## Forms

- [ ] [Typed reactive forms and disabled controls](tricky-angular-interview-answers.md#typed-reactive-forms-and-disabled-controls)
- [ ] [ControlValueAccessor](tricky-angular-interview-answers.md#controlvalueaccessor)
- [ ] [Async validators and updateOn](tricky-angular-interview-answers.md#async-validators-and-updateon)

## State management

- [ ] [NgRx: actions, reducers, selectors, effects](tricky-angular-interview-answers.md#ngrx-actions-reducers-selectors-effects)
- [ ] [NgRx effects error handling](tricky-angular-interview-answers.md#ngrx-effects-error-handling)
- [ ] [When NgRx is overkill](tricky-angular-interview-answers.md#when-ngrx-is-overkill)
- [ ] [NgRx SignalStore](tricky-angular-interview-answers.md#ngrx-signalstore)

## SSR, errors, and security

- [ ] [SSR hydration mismatches and browser-only code](tricky-angular-interview-answers.md#ssr-hydration-mismatches-and-browser-only-code)
- [ ] [Global error handling with ErrorHandler](tricky-angular-interview-answers.md#global-error-handling-with-errorhandler)
- [ ] [Sanitization and bypassSecurityTrust](tricky-angular-interview-answers.md#sanitization-and-bypasssecuritytrust)

## Testing and performance

- [ ] [Testing OnPush components](tricky-angular-interview-answers.md#testing-onpush-components)
- [ ] [fakeAsync, tick, and zoneless tests](tricky-angular-interview-answers.md#fakeasync-tick-and-zoneless-tests)
- [ ] [Profiling with Angular DevTools](tricky-angular-interview-answers.md#profiling-with-angular-devtools)
- [ ] [Virtual scrolling with the CDK](tricky-angular-interview-answers.md#virtual-scrolling-with-the-cdk)

## Big-picture questions

- [ ] [Migrating NgModules to standalone, signals, and zoneless](tricky-angular-interview-answers.md#migrating-ngmodules-to-standalone-signals-and-zoneless)
- [ ] [Angular vs React](tricky-angular-interview-answers.md#angular-vs-react)
