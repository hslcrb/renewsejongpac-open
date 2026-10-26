import assert from "node:assert/strict";
import { test } from "node:test";
import { DESIGN_TOKEN_VALUES, TEXT_VARIANTS } from "../src/data/design-tokens.ts";
import * as contracts from "../src/system/component-contracts.ts";

// [탐색 위계와 헤더 전용 아이콘의 경계 / Navigation hierarchy and the header-only icon boundary]
test("primary navigation and utility navigation keep distinct shared roles above the text floor", () => {
    const roles = TEXT_VARIANTS as Record<string, { token: string; weight: number; minimum: number }>;
    const tokens = DESIGN_TOKEN_VALUES as Record<string, string>;
    assert.equal(roles.navigation?.weight, 500);
    assert.equal(roles.utility?.weight, 500);
    assert.equal(tokens[`--${roles.navigation?.token}`], "1.125rem");
    assert.equal(tokens[`--${roles.utility?.token}`], "1rem");
    assert.ok(roles.navigation.minimum > roles.utility.minimum);
    assert.ok(roles.utility.minimum >= 16);
    assert.equal(tokens["--text-action"], "1.25rem", "other action typography stays intact");
});

test("the larger header group belongs only to search and menu and preserves the control target", () => {
    const contract = contracts as unknown as { HEADER_ACTION_ICONS?: readonly string[]; isHeaderActionIcon?: (name: string) => boolean };
    assert.deepEqual(contract.HEADER_ACTION_ICONS, ["search", "menu"]);
    assert.ok(contract.isHeaderActionIcon?.("search"));
    assert.ok(contract.isHeaderActionIcon?.("menu"));
    for (const name of ["heart", "user", "close", "calendar", "arrow"]) assert.equal(contract.isHeaderActionIcon?.(name), false);
    const tokens = DESIGN_TOKEN_VALUES as Record<string, string>;
    assert.equal(tokens["--icon-header-action-size"], "1.75rem");
    assert.equal(tokens["--control-size"], "3rem");
});
