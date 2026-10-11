import { parseSaved, toggleSaved } from '../src/lib/saved';

const known = (id: number) => id >= 1 && id <= 100;

describe('parseSaved', () => {
  it('reads a valid list in order', () => expect(parseSaved('[5,2,9]', known)).toEqual([5, 2, 9]));
  it('returns [] for missing, corrupt, or wrongly-shaped data', () => {
    expect(parseSaved(null, known)).toEqual([]);
    expect(parseSaved('{oops', known)).toEqual([]);
    expect(parseSaved('{"a":1}', known)).toEqual([]);
  });
  it('drops duplicates, unknown ids, and non-integers', () => {
    expect(parseSaved('[3,3,500,"7",2.5,4]', known)).toEqual([3, 4]);
  });
});

describe('toggleSaved', () => {
  it('adds new saves to the front', () => expect(toggleSaved([2, 3], 9)).toEqual([9, 2, 3]));
  it('removes an existing save', () => expect(toggleSaved([2, 3, 4], 3)).toEqual([2, 4]));
  it('does not mutate its input', () => {
    const ids = [1, 2];
    toggleSaved(ids, 1);
    expect(ids).toEqual([1, 2]);
  });
});
