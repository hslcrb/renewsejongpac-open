/**
 * Multi-line text gates — the pure greedy word-wrap (measurer injected, no canvas needed).
 * Block-height arithmetic is exercised indirectly through Text's computeBounds in the
 * layout/measure paths; the wrap decisions are the part with edge cases worth pinning.
 */
import { describe, it, expect } from 'vitest'
import { wrapLines } from '../../utilities/textMeasure'

// Deterministic measurer: 10 units per character (space included).
const measure = (s: string) => s.length * 10

describe('wrapLines', () => {
    it('no max width → explicit lines only', () => {
        expect(wrapLines('one two three', 0, measure)).toEqual(['one two three'])
        expect(wrapLines('a\nb\nc', 0, measure)).toEqual(['a', 'b', 'c'])
        expect(wrapLines('a\r\nb\rc', 0, measure)).toEqual(['a', 'b', 'c'])
    })

    it('greedy wrap at the max width', () => {
        // "one two" = 70 ≤ 75; "one two three" = 130 > 75 → break before "three"
        expect(wrapLines('one two three', 75, measure)).toEqual(['one two', 'three'])
    })

    it('explicit breaks wrap independently', () => {
        // "one two" = 70 ≤ 95, "+ three" = 130 > 95 → break; "four five" = 90 ≤ 95 stays whole
        expect(wrapLines('one two three\nfour five', 95, measure)).toEqual(['one two', 'three', 'four five'])
    })

    it('a word longer than the max overflows on its own line (no mid-word break)', () => {
        expect(wrapLines('hi extraordinarily hi', 80, measure)).toEqual(['hi', 'extraordinarily', 'hi'])
    })

    it('single word never breaks', () => {
        expect(wrapLines('word', 10, measure)).toEqual(['word'])
    })

    it('empty string is one empty line', () => {
        expect(wrapLines('', 100, measure)).toEqual([''])
    })
})
