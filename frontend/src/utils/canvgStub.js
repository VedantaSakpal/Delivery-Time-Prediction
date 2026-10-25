// Dummy shim for optional jspdf svg/canvg dependency to prevent broken core-js polyfill resolution
export default {
  fromString: () => ({ render: () => Promise.resolve() }),
  fromElement: () => ({ render: () => Promise.resolve() })
};
export const Canvg = {
  fromString: () => ({ render: () => Promise.resolve() }),
  fromElement: () => ({ render: () => Promise.resolve() })
};
