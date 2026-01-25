# Motor3 Testing Checklist

## Performance Tests

- [ ] Keystroke render count: Target <2 renders (was 4 in Motor2)
- [ ] Keyboard persistence: No dismissal on parent re-render
- [ ] Form responsiveness: <100ms input lag
- [ ] Underwriter comparison: <2s load time

## Functional Tests - Third Party

- [ ] Category selection works
- [ ] Registration number validation (KDA 123A format)
- [ ] DMVIC integration auto-fills correctly
- [ ] Underwriters auto-load on mount
- [ ] Underwriter selection persists
- [ ] Client details validation
- [ ] Document upload works
- [ ] Payment integration
- [ ] Quote submission successful

## Functional Tests - Comprehensive

- [ ] Sum insured validation (min 500,000)
- [ ] Windscreen value validation (max 30,000)
- [ ] Radio/cassette validation (min 30,000)
- [ ] Add-ons selection works
- [ ] Instalment calculation correct (40-30-30 or 25-25-25-25)
- [ ] Underwriter comparison triggers after sum_insured entered
- [ ] Premium breakdown displays correctly

## Product Coverage Tests

Test at least 1 product from each category:

- [ ] Private Third Party (FIXED)
- [ ] Private Comprehensive (BRACKET)
- [ ] Commercial (TONNAGE)
- [ ] PSV (PASSENGER)
- [ ] Special Classes (HYBRID)

## Edge Cases

- [ ] Network failure handling
- [ ] Invalid registration number
- [ ] Sum insured below minimum
- [ ] Missing required fields
- [ ] Payment failure
- [ ] Submission retry

## Motor2 Mistakes Eliminated

- [x] No 4 renders per keystroke
- [x] No keyboard dismissal
- [x] No monolithic 2092-line form
- [x] No initialData with 9+ dependencies
- [x] No underwriter re-selection loops
- [x] Proper context separation
- [x] Clean step-based navigation
