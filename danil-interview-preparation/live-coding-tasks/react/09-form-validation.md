# Controlled Form Validation

## Statement
Build a controlled login form in React + TypeScript:
- fields: `email`, `password`
- track `dirty`/`touched` state
- run synchronous validation
- submit asynchronously
- disable submit while request is pending

## Requirements
- React 18+ hooks and TypeScript.
- Controlled inputs for email/password.
- Track touched fields (`onBlur`).
- Sync validation rules:
  - email must be valid format
  - password min length 8
- Show field errors only when touched (or after submit).
- Simulate async submit with timeout.
- Disable submit while pending.

## Time box
35-45 minutes

## What interviewers look for (Что ищут)
- Управление формой без лишних библиотек.
- Прозрачная модель `values/errors/touched/submitting`.
- Правильный UX показа ошибок (не слишком рано).
- Блокировка повторной отправки при pending.
- Читаемость и предсказуемость кода.

## Hints
> - Вынеси `validate(values)` в отдельную функцию.
> - Полезно иметь `submitted` флаг, чтобы показать ошибки после первой попытки submit.
> - `dirty` можно вычислять из сравнения с initial values.
> - Не забудь `try/finally` для `submitting`.

## Reference solution
```tsx
import React, { useMemo, useState } from "react";

type FormValues = {
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  email: "",
  password: "",
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Invalid email format";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  return errors;
}

async function fakeSubmit(values: FormValues): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  console.log("Submitted", values);
}

export default function LoginForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Record<keyof FormValues, boolean>>({
    email: false,
    password: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = values.email !== INITIAL_VALUES.email || values.password !== INITIAL_VALUES.password;

  const shouldShowError = (field: keyof FormValues) => touched[field] || submitted;

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    if (!isValid) return;

    try {
      setSubmitting(true);
      await fakeSubmit(values);
      setSubmitSuccess(true);
      setValues(INITIAL_VALUES);
      setTouched({ email: false, password: false });
      setSubmitted(false);
    } catch {
      setSubmitError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: "24px auto", fontFamily: "sans-serif" }}>
      <h1>Login Form</h1>
      <form onSubmit={onSubmit} noValidate>
        <label style={{ display: "block", marginBottom: 10 }}>
          Email
          <input
            type="email"
            value={values.email}
            onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
          {shouldShowError("email") && errors.email && (
            <small style={{ color: "crimson" }}>{errors.email}</small>
          )}
        </label>

        <label style={{ display: "block", marginBottom: 10 }}>
          Password
          <input
            type="password"
            value={values.password}
            onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            style={{ display: "block", width: "100%", marginTop: 4 }}
          />
          {shouldShowError("password") && errors.password && (
            <small style={{ color: "crimson" }}>{errors.password}</small>
          )}
        </label>

        <button type="submit" disabled={submitting || !isDirty}>
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {submitError && <p style={{ color: "crimson" }}>{submitError}</p>}
      {submitSuccess && <p style={{ color: "green" }}>Submitted successfully.</p>}
    </main>
  );
}
```

## Follow-up questions
- How would you add async email uniqueness validation?
- Как не спамить API при валидации на каждый keypress?
- What changes for multi-step form flow?
- Как интегрировать это с React Hook Form и сохранить UX?
