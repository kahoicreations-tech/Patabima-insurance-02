// DEPRECATED: genericQuotesService has been retired along with GenericQuoteCreate flow.
// All non-motor quoting currently routes through dedicated WIBA screens.
// This stub intentionally does nothing; kept only to avoid import errors if any stale code remains.
export const genericQuotesService = new Proxy({}, {
  get() {
    throw new Error('genericQuotesService is deprecated and no longer available. Use dedicated product services.');
  }
});
