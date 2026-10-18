/**
 * Two services return lists of active credit applications.
 * Each list is sorted by ascending id.
 * ids are shared across both services (one sequence, no duplicates).
 *
 * Return the k most recent applications (highest ids).
 *
 * Run: node general-js/practice/get-last-decisions.js
 */

const getDecisions1 = [
  { id: 1, result: "approved" },
  { id: 3, result: "waiting" },
  { id: 15, result: "approved" },
  { id: 20, result: "approved" },
  { id: 26, result: "waiting" },
  { id: 30, result: "approved" },
];

const getDecisions2 = [
  { id: 2, result: "approved" },
  { id: 4, result: "waiting" },
  { id: 16, result: "approved" },
  { id: 23, result: "waiting" },
  { id: 32, result: "approved" },
];

function getLastDecision(decision1, decision2, k) {
  let pointer1 = decision1.length - 1;
  let pointer2 = decision2.length - 1;

  //edge cases
  if (pointer1 < 0) {
    return decision2.slice(0, k);
  }
  if (pointer2 < 0) {
    return decision1.slice(0, k);
  }
  if (pointer1 === 0 && pointer2 === 0) {
    return [decision1[0], decision2[0]];
  }

  let result = [];

  while (result.length < k) {
    let valueArr1 = decision1[pointer1]?.id;
    let valueArr2 = decision2[pointer2]?.id;
    if (valueArr1 > valueArr2) {
      result.push(decision1[pointer1]);
      pointer1--;
    } else {
      result.push(decision2[pointer2]);
      pointer2--;
    }
  }
  return result;
}

// Expected for k = 5:
// [
//   { id: 32, result: 'approved' },
//   { id: 30, result: 'approved' },
//   { id: 26, result: 'waiting' },
//   { id: 23, result: 'waiting' },
//   { id: 20, result: 'approved' },
// ]

console.log(getLastDecision(getDecisions1, getDecisions2, 5));
