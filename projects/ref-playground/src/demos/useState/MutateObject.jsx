import { useState } from "react";

export function MutateObject() {
  const [user, setUser] = useState({ name: "Ada" });

  function mutate() {
    user.name = "Grace";
    console.log("mutated object", user.name);
  }

  function replace() {
    setUser({ ...user, name: "Grace" });
  }

  return (
    <section className="panel">
      <h2>Do not mutate state</h2>
      <p>Changing a field on the object does not render. Replacing the object does.</p>
      <p>Name: {user.name}</p>
      <div className="row">
        <button type="button" onClick={mutate}>
          Mutate
        </button>
        <button type="button" onClick={replace}>
          Replace
        </button>
      </div>
    </section>
  );
}
