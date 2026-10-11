/** Returns a copy of `list` with the item at `from` moved to index `to`. */
export function moveItem(list, from, to) {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
