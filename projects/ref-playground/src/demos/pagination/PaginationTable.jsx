import { useState } from "react";

const PAGE_SIZE = 5;

const ROWS = [
  ["ada", "Ada Lovelace", "Engineer", "London"],
  ["grace", "Grace Hopper", "Engineer", "New York"],
  ["alan", "Alan Turing", "Researcher", "London"],
  ["katherine", "Katherine Johnson", "Mathematician", "Hampton"],
  ["margaret", "Margaret Hamilton", "Engineer", "Cambridge"],
  ["linus", "Linus Torvalds", "Engineer", "Helsinki"],
  ["barbara", "Barbara Liskov", "Researcher", "Los Angeles"],
  ["donald", "Donald Knuth", "Researcher", "Stanford"],
  ["edsger", "Edsger Dijkstra", "Researcher", "Amsterdam"],
  ["tim", "Tim Berners-Lee", "Engineer", "London"],
  ["radia", "Radia Perlman", "Engineer", "Portsmouth"],
  ["guido", "Guido van Rossum", "Engineer", "Amsterdam"],
].map(([id, name, role, city]) => ({ id, name, role, city }));

export function PaginationTable() {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(ROWS.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = ROWS.slice(start, start + PAGE_SIZE);

  return (
    <section className="panel">
      <h2>Paginated table</h2>
      <ul className="notes">
        <li>The page number is state. The rows on screen are a slice calculated during render.</li>
        <li>Do not store the current page in a second array. That copy goes stale when the source changes.</li>
        <li>Each row is keyed by its id. Index 0 is a different person on every page.</li>
        <li>Previous stays disabled on the first page. Next stays disabled on the last page.</li>
        <li>A server list puts the page in the request. This table slices local rows so the math is visible.</li>
      </ul>
      <p>
        {start + 1}–{start + visible.length} of {ROWS.length}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>City</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.role}</td>
              <td>{row.city}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <nav className="row" aria-label="Pagination">
        <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
          Previous
        </button>
        {Array.from({ length: pageCount }, (_, index) => {
          const number = index + 1;
          return (
            <button
              key={number}
              type="button"
              aria-pressed={number === currentPage}
              onClick={() => setPage(number)}
            >
              {number}
            </button>
          );
        })}
        <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
          Next
        </button>
      </nav>
    </section>
  );
}
