import assert from "assert";
import { sum } from "./sum.js"

describe(`t00_example_sum`, () => {
  it(`#sum`, () => {
    assert.equal(sum(1,2), 3, `sum 1+2 should equals 3`);
  });
});
