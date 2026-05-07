export function hasRelevantSelectorMutation(
  mutations: MutationRecord[],
  options: {
    isInsideOwnedSurface: (node: Node) => boolean;
    isExternalNode: (node: Element) => boolean;
    selector: string;
  },
): boolean {
  return mutations.some((mutation) => {
    if (options.isInsideOwnedSurface(mutation.target)) {
      return false;
    }

    return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
      return (
        node instanceof Element &&
        options.isExternalNode(node) &&
        matchesOrContainsSelector(node, options.selector)
      );
    });
  });
}

function matchesOrContainsSelector(node: Element, selector: string): boolean {
  return !!(node.matches?.(selector) || node.querySelector?.(selector));
}
