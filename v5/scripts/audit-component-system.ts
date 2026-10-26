import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import type { ComponentDefinition } from "../src/data/component-registry.ts";

export type AuditIssue = { code: string; source: string; message: string; line?: number };
export type ComponentUsage = { status: "product" | "guide-only" | "unused"; productUses: string[]; guideUses: string[] };
export type ComponentCounts = { total: number; product: number; documentationOnly: number; unused: number };
export type AuditResult = { issues: AuditIssue[]; usage: Record<string, ComponentUsage>; counts: ComponentCounts };
export type ControlException = { source: string; tag: string; part: string; reason: string; owner: string };
export type AuditOptions = {
    root: string;
    registry: readonly ComponentDefinition[];
    exceptions?: readonly ControlException[];
    chapters: readonly { id: string; sections: readonly (readonly string[])[] }[];
    canonicalTokens?: readonly string[];
    enforceIdentity?: boolean;
    requireProductUsage?: boolean;
    documentationTools?: readonly { id: string; source: string; exportName: string }[];
};
type Scope = { id: string; source: string; name: string; node: ts.Node; body: ts.Node; edges: Set<Scope> };

const slash = (value: string) => value.replace(/\\/g, "/");
const normalized = (value: string) => value.replace(/\r\n/g, "\n");
const sortStrings = (values: Iterable<string>) => [...new Set(values)].sort();
const isGuide = (source: string) => source.startsWith("app/design-rules/");
const routeFile = (source: string) => /(?:^|\/)(?:page|layout|not-found|error|global-error|loading|template)\.tsx$/.test(source);

function filesBelow(directory: string): string[] {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = resolve(directory, entry.name);
        return entry.isDirectory() ? filesBelow(target) : [target];
    }).sort();
}

// [복사하는 JSX도 같은 속성 계약을 검사 / Copied JSX follows the same prop contracts]
export function auditCopiedComponentCode(code: string, registry: readonly ComponentDefinition[], source = "copied-example"): AuditIssue[] {
    if (/^\s*\/\/ DOCUMENTATION_ONLY\b/.test(code)) return [];
    const file = ts.createSourceFile("example.tsx", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const issues: AuditIssue[] = [];
    const inspect = (node: ts.Node) => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            const tag = node.tagName.getText(file);
            const record = registry.find(entry => entry.name === tag || entry.exportName === tag || entry.source.split("/").pop() === `${tag}.tsx`);
            for (const attribute of node.attributes.properties) {
                if (!ts.isJsxAttribute(attribute)) continue;
                const axis = attribute.name.getText(file);
                if (tag === "LiquidGlass" && ["opacity", "refraction", "blur", "thickness"].includes(axis))
                    issues.push({ code: "copied-glass-override", source, message: "Product copy must select a LiquidGlass variant; material experiments require the DOCUMENTATION_ONLY label." });
                const initializer = attribute.initializer;
                const value = initializer && ts.isStringLiteral(initializer) ? initializer.text : undefined;
                if (value !== undefined && !value.includes("__dynamic__") && record?.axes?.[axis] && !record.axes[axis].includes(value))
                    issues.push({ code: "copied-axis-value", source, message: `${tag}.${axis} uses unknown value ${value}.` });
            }
        }
        ts.forEachChild(node, inspect);
    };
    inspect(file);
    return issues;
}

// [구문과 심벌을 이용한 컴포넌트 단위 분석 / Component-scoped syntax and symbol analysis]
export function auditComponentSystem({ root, registry, exceptions = [], chapters, canonicalTokens = [], enforceIdentity = false, requireProductUsage = false, documentationTools = [] }: AuditOptions): AuditResult {
    root = resolve(root);
    const issues: AuditIssue[] = [];
    const addIssue = (code: string, source: string, message: string, node?: ts.Node) => {
        issues.push({ code, source, message, ...(node ? { line: node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1 } : {}) });
    };
    const roots = ["app", "components"].flatMap((directory) => filesBelow(resolve(root, directory)))
        .filter((source) => /\.(?:ts|tsx)$/.test(source) && !source.endsWith(".d.ts"));
    const program = ts.createProgram(roots, {
        target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.Preserve, noEmit: true, noLib: true, types: [], skipLibCheck: true,
        allowImportingTsExtensions: true, baseUrl: root, paths: { "@/*": ["./*"] },
    });
    const checker = program.getTypeChecker();
    const authored = program.getSourceFiles().filter((file) => {
        const source = slash(relative(root, file.fileName));
        return !source.startsWith("../") && !isAbsolute(source) && !source.split("/").includes("node_modules") && !file.isDeclarationFile;
    });
    const sourceFiles = new Map(authored.map((file) => [slash(relative(root, file.fileName)), file]));
    const scopes: Scope[] = [];
    const byDeclaration = new Map<ts.Node, Scope>();
    const addScope = (node: ts.Node, body: ts.Node, name: string) => {
        const source = slash(relative(root, node.getSourceFile().fileName));
        const scope = { id: `${source}:${node.pos}`, source, name, node, body, edges: new Set<Scope>() };
        scopes.push(scope);
        byDeclaration.set(node, scope);
    };
    for (const file of authored) {
        const collect = (node: ts.Node) => {
            if (ts.isFunctionDeclaration(node) && node.body) addScope(node, node.body, node.name?.text || "default");
            else if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) addScope(node, node.initializer, node.name.text);
            else if (ts.isClassDeclaration(node) && node.name) addScope(node, node, node.name.text);
            else if (ts.isExportAssignment(node)) addScope(node, node.expression, "default");
            ts.forEachChild(node, collect);
        };
        collect(file);
    }

    const scopesFromSymbol = (symbol: ts.Symbol | undefined, seen = new Set<ts.Symbol>()): Set<Scope> => {
        const result = new Set<Scope>();
        if (!symbol || seen.has(symbol)) return result;
        seen.add(symbol);
        if (symbol.flags & ts.SymbolFlags.Alias) {
            for (const scope of scopesFromSymbol(checker.getAliasedSymbol(symbol), seen)) result.add(scope);
            return result;
        }
        for (const declaration of symbol.declarations || []) {
            if (ts.isExportAssignment(declaration)) {
                const expression = declaration.expression;
                const unwrap = (node: ts.Node) => {
                    if (ts.isIdentifier(node)) {
                        for (const scope of scopesFromSymbol(checker.getSymbolAtLocation(node), seen)) result.add(scope);
                    } else if (ts.isCallExpression(node)) node.arguments.forEach(unwrap);
                    else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) unwrap(node.expression);
                };
                unwrap(expression);
                if (result.size) continue;
            }
            const scope = byDeclaration.get(declaration);
            if (scope) result.add(scope);
        }
        return result;
    };
    const referencedScopes = (node: ts.Node) => scopesFromSymbol(checker.getSymbolAtLocation(node));

    for (const scope of scopes) {
        const visit = (node: ts.Node) => {
            if (node !== scope.node && byDeclaration.has(node)) return;
            if (ts.isTypeNode(node) || ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
            if (ts.isIdentifier(node)) {
                for (const target of referencedScopes(node)) if (target !== scope) scope.edges.add(target);
            }
            ts.forEachChild(node, visit);
        };
        visit(scope.body);
    }

    const containsRender = (scope: Scope, seen = new Set<Scope>()): boolean => {
        if (seen.has(scope)) return false;
        seen.add(scope);
        let found = false;
        const visit = (node: ts.Node) => {
            if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)
                || (ts.isReturnStatement(node) && node.expression?.kind === ts.SyntaxKind.NullKeyword)
                || (ts.isCallExpression(node) && /^(?:React\.)?(?:createElement|createPortal)$/.test(node.expression.getText()))) found = true;
            if (!found) ts.forEachChild(node, visit);
        };
        visit(scope.body);
        if (!found && ts.isCallExpression(scope.body) && /(?:^|\.)(?:memo|forwardRef)$/.test(scope.body.expression.getText())) {
            found = scope.body.arguments.some((argument) => [...referencedScopes(argument)].some((target) => containsRender(target, seen)));
        }
        return found;
    };
    const callable = (scope: Scope) => {
        if (ts.isFunctionDeclaration(scope.node) || ts.isClassDeclaration(scope.node)) return true;
        let expression = ts.isVariableDeclaration(scope.node) ? scope.node.initializer
            : ts.isExportAssignment(scope.node) ? scope.node.expression : undefined;
        if (!expression) return false;
        while (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression) || ts.isParenthesizedExpression(expression)) expression = expression.expression;
        if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) return true;
        return ts.isCallExpression(expression) && /(?:^|\.)(?:memo|forwardRef)$/.test(expression.expression.getText());
    };
    const exportedComponents = new Map<string, { scope: Scope; exports: string[] }[]>();
    const exportTargets = new Map<string, Set<Scope>>();
    for (const [source, file] of sourceFiles) {
        const moduleSymbol = checker.getSymbolAtLocation(file);
        if (!moduleSymbol) continue;
        const grouped = new Map<Scope, string[]>();
        for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
            const targets = scopesFromSymbol(symbol);
            exportTargets.set(`${source}#${symbol.name}`, targets);
            for (const scope of targets) {
                if (scope.source !== source || !/^[A-Z]/.test(scope.name) && scope.name !== "default" || !callable(scope) || !containsRender(scope)) continue;
                grouped.set(scope, [...(grouped.get(scope) || []), symbol.name]);
            }
        }
        exportedComponents.set(source, [...grouped].map(([scope, exports]) => ({ scope, exports: exports.sort() })));
    }

    // [등록부의 완전성·연결·중복 검증 / Registry completeness, valid links and aliases]
    const guidePaths = new Set(chapters.flatMap((chapter) => chapter.sections.map(([section]) => `${chapter.id}/${section}`)));
    const ids = new Set<string>();
    const registryScopes = new Map<string, Set<Scope>>();
    const registeredScopes = new Map<Scope, string>();
    const nativeTags = new Set(["button", "input", "select", "textarea"]);
    const nativeOwnership = new Map<Scope, ReadonlySet<string>>();
    for (const record of registry) {
        const source = slash(record.source);
        if (!record.id || ids.has(record.id)) addIssue("duplicate-id", source, `Component id must be unique: ${record.id}`);
        ids.add(record.id);
        if (!record.name?.trim() || !record.purpose?.trim() || !["ui", "structure", "internal", "demo"].includes(record.kind))
            addIssue("invalid-record", source, `Component ${record.id} needs a name, purpose and valid kind.`);
        if (!guidePaths.has(record.guide)) addIssue("invalid-guide", source, `Component ${record.id} points to unknown guide section ${record.guide}.`);
        if (!(source.startsWith("components/") || source.startsWith("app/") || source.startsWith("src/")) || !source.endsWith(".tsx") || source.split("/").includes("..") || routeFile(source)) {
            addIssue("invalid-source", source, `Component ${record.id} must refer to a shared or colocated component, not a route file.`);
        }
        if (!sourceFiles.has(source)) {
            addIssue("missing-source", source, `Component ${record.id} source does not exist.`);
            continue;
        }
        if (enforceIdentity && (record.kind === "ui" || record.kind === "demo")) {
            const markerIds = new Set<string>();
            const findMarkers = (node: ts.Node) => {
                if (ts.isJsxAttribute(node) && node.name.getText() === "data-component-id" && node.initializer && ts.isStringLiteral(node.initializer)) markerIds.add(node.initializer.text);
                if ((ts.isPropertyAssignment(node) || ts.isBindingElement(node)) && (ts.isPropertyAssignment(node) ? node.name.getText().replace(/["']/g, "") : node.propertyName?.getText().replace(/["']/g, "")) === "data-component-id"
                    && node.initializer && ts.isStringLiteral(node.initializer)) markerIds.add(node.initializer.text);
                ts.forEachChild(node, findMarkers);
            };
            findMarkers(sourceFiles.get(source)!);
            if (!markerIds.has(record.id)) addIssue("missing-component-id", source, `Component ${record.id} must expose its canonical data-component-id on its existing root.`);
        }
        if (enforceIdentity && record.kind === "internal" && record.parent) {
            const parts = new Set<string>();
            const owners = new Set<string>();
            const findParts = (node: ts.Node) => {
                if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
                    if (node.name.getText() === "data-component-part") parts.add(node.initializer.text);
                    if (node.name.getText() === "data-component-owner") owners.add(node.initializer.text);
                }
                ts.forEachChild(node, findParts);
            };
            findParts(sourceFiles.get(source)!);
            if (!parts.has(record.id) || !owners.has(record.parent)) addIssue("missing-component-owner", source, `Internal ${record.id} must annotate its existing part with owner ${record.parent}; do not add a wrapper.`);
        }
        const targets = exportTargets.get(`${source}#${record.exportName}`);
        if (!targets?.size) {
            addIssue("missing-export", source, `Component ${record.id} export ${record.exportName} does not exist.`);
            continue;
        }
        const components = exportedComponents.get(source) || [];
        const validTargets = new Set([...targets].filter((target) => components.some(({ scope }) => scope === target)));
        if (!validTargets.size) addIssue("invalid-component", source, `Export ${record.exportName} is not a locally defined React component.`);
        registryScopes.set(record.id, validTargets);
        for (const scope of validTargets) {
            if (registeredScopes.has(scope)) addIssue("duplicate-component", source, `Component ${record.id} duplicates ${registeredScopes.get(scope)} through an export alias.`);
            else registeredScopes.set(scope, record.id);
            if (record.nativeControls) nativeOwnership.set(scope, new Set(record.nativeControls));
        }
        if (record.nativeControls && (!record.nativeControls.length || new Set(record.nativeControls).size !== record.nativeControls.length
            || record.nativeControls.some((tag) => !nativeTags.has(tag))))
            addIssue("invalid-native-ownership", source, `Component ${record.id} nativeControls must contain unique native control tags.`);
        for (const [axis, values] of Object.entries(record.axes || {})) {
            if (!axis.trim() || !values.length || new Set(values).size !== values.length || values.some(value => !value.trim()))
                addIssue("invalid-axis", source, `Component ${record.id} axis ${axis} must contain unique nonempty values.`);
            if (record.examples && values.some(value => !record.examples!.some(example => example.axis === axis && example.value === value)))
                addIssue("missing-axis-example", source, `Component ${record.id} axis ${axis} requires a live example for every allowed value.`);
        }
        const exampleIds = new Set<string>();
        for (const example of record.examples || []) {
            if (exampleIds.has(example.id) || !/^example-[a-z0-9-]+$/.test(example.id)) addIssue("invalid-example", source, `Invalid or duplicate example anchor ${example.id}.`);
            exampleIds.add(example.id);
            if (example.axis && !record.axes?.[example.axis]?.includes(example.value || "")) addIssue("invalid-example-value", source, `Example ${example.id} uses an unknown axis value.`);
            if (example.state && !record.states?.includes(example.state)) addIssue("invalid-example-state", source, `Example ${example.id} uses an unknown state.`);
        }
        for (const state of record.states || []) if (record.examples && !record.examples.some(example => example.state === state))
            addIssue("missing-state-example", source, `Component ${record.id} requires a live example for state ${state}.`);
        if (record.previewRoute && !record.previewRoute.startsWith("/")) addIssue("invalid-preview", source, `Component ${record.id} preview route must be an absolute site path.`);
        if (record.layoutOwner && (!routeFile(record.layoutOwner) || !sourceFiles.has(record.layoutOwner))) addIssue("invalid-layout-owner", source, `Component ${record.id} must name an existing layout route owner.`);
    }
    for (const record of registry) {
        if (record.parent && (!ids.has(record.parent) || record.parent === record.id)) addIssue("invalid-parent", slash(record.source), `Component ${record.id} has invalid parent ${record.parent}.`);
        if (record.kind === "internal" && !record.parent) addIssue("missing-parent", slash(record.source), `Internal component ${record.id} requires its owning component relation.`);
    }
    // [문서 도구를 제품 수에서 분리하되 내보내기와 접근 경로는 검사 / Audit documentation tools without counting them as product UI]
    const documentationScopes = new Map<string, Set<Scope>>();
    const documentationIds = new Set<string>();
    for (const tool of documentationTools) {
        const source = slash(tool.source);
        if (documentationIds.has(tool.id) || ids.has(tool.id)) addIssue("duplicate-documentation-tool", source, `Documentation tool ${tool.id} must have a unique non-product ID.`);
        documentationIds.add(tool.id);
        if (!source.startsWith("app/design-rules/_documentation/")) addIssue("invalid-documentation-source", source, `Documentation tool ${tool.id} must live inside the guide's private documentation directory.`);
        const targets = exportTargets.get(`${source}#${tool.exportName}`);
        const components = exportedComponents.get(source) || [];
        const valid = new Set([...(targets || [])].filter(target => components.some(({ scope }) => scope === target)));
        if (!valid.size) addIssue("missing-documentation-export", source, `Documentation tool ${tool.id} must name an existing local React export.`);
        for (const scope of valid) {
            if (registeredScopes.has(scope)) addIssue("duplicate-component", source, `Documentation tool ${tool.id} duplicates ${registeredScopes.get(scope)}.`);
            else registeredScopes.set(scope, `documentation:${tool.id}`);
        }
        documentationScopes.set(tool.id, valid);
    }
    for (const [source, components] of exportedComponents) {
        if (!(source.startsWith("components/") || source.startsWith("app/") || source.startsWith("src/")) || !source.endsWith(".tsx") || routeFile(source)) continue;
        for (const { scope, exports } of components) if (!registeredScopes.has(scope)) {
            addIssue("unregistered-component", source, `Exported React component ${exports.join(" / ")} (${scope.name}) is not registered.`, scope.node);
        }
    }

    // [도달 가능한 함수만 따라가는 사용처 분석 / Follow only reachable component and helper scopes]
    const rootEntries = (guide: boolean) => {
        const routes = [...sourceFiles.keys()].filter(source => source.startsWith("app/") && routeFile(source) && isGuide(source) === guide);
        const inherited = routes.flatMap(source => {
            const ancestors: string[] = [];
            let directory = dirname(source).replace(/\\/g, "/");
            while (directory === "app" || directory.startsWith("app/")) {
                for (const name of ["layout", "template"]) if (sourceFiles.has(`${directory}/${name}.tsx`)) ancestors.push(`${directory}/${name}.tsx`);
                directory = dirname(directory).replace(/\\/g, "/");
            }
            return ancestors;
        });
        return sortStrings([...routes, ...inherited]).flatMap(source => [...(exportTargets.get(`${source}#default`) || [])].map(scope => ({ source, scope })));
    };
    const reach = (initial: Scope[]) => {
        const result = new Set<Scope>();
        const pending = [...initial];
        while (pending.length) {
            const scope = pending.pop()!;
            if (result.has(scope)) continue;
            result.add(scope);
            pending.push(...scope.edges);
        }
        return result;
    };
    const productEntries = rootEntries(false);
    const guideEntries = rootEntries(true);
    const productScopes = reach(productEntries.map(({ scope }) => scope));
    const guideScopes = reach(guideEntries.map(({ scope }) => scope));
    const uses = (targets: Set<Scope>, reachable: Set<Scope>, entries: ReturnType<typeof rootEntries>) => sortStrings([
        ...[...reachable].filter((caller) => [...caller.edges].some((target) => targets.has(target)))
            .map((caller) => `${caller.source}#${caller.name}`),
        ...entries.filter(({ scope }) => targets.has(scope)).map(({ source }) => `${source}#default`),
    ]);
    const usage: Record<string, ComponentUsage> = {};
    for (const record of [...registry].sort((first, second) => first.id.localeCompare(second.id, "en"))) {
        const targets = registryScopes.get(record.id) || new Set<Scope>();
        const productUses = uses(targets, productScopes, productEntries);
        const guideUses = uses(targets, guideScopes, guideEntries);
        usage[record.id] = { status: productUses.length ? "product" : guideUses.length ? "guide-only" : "unused", productUses, guideUses };
        if (requireProductUsage && !productUses.length) addIssue("missing-product-use", record.source, `Registered product component ${record.id} must be reachable from a product route; documentation tools and retired implementations do not belong in the product registry.`);
        if (productUses.length && record.lifecycle === "deprecated") addIssue("deprecated-product-use", record.source, `Deprecated ${record.id} is reachable from product routes.`);
        if (productUses.length && record.kind === "demo") addIssue("demo-product-use", record.source, `Documentation-only ${record.id} is reachable from product routes.`);
    }
    for (const tool of documentationTools) {
        const scopes = documentationScopes.get(tool.id) || new Set<Scope>();
        if ([...scopes].some(scope => productScopes.has(scope))) addIssue("documentation-tool-product-use", tool.source, `Documentation tool ${tool.id} must not be imported by product routes.`);
        if (scopes.size && ![...scopes].some(scope => guideScopes.has(scope))) addIssue("unused-documentation-tool", tool.source, `Documentation tool ${tool.id} is not reachable from the guide.`);
    }

    // [소스·태그·표식이 일치하는 예외만 허용 / Require exact source, tag and marker for exceptions]
    const exceptionKey = (source: string, tag: string, part: string) => `${slash(source)}#${tag}#${part}`;
    const exceptionMap = new Map<string, ControlException>();
    const matchedExceptions = new Set<string>();
    for (const exception of exceptions) {
        const key = exceptionKey(exception.source, exception.tag, exception.part);
        if (!exception.source || !exception.tag || !exception.part || !exception.reason?.trim() || !exception.owner?.trim())
            addIssue("invalid-exception", slash(exception.source), `Control exception ${exception.part} requires a source, tag, marker, reason and owner.`);
        if (exceptionMap.has(key)) addIssue("duplicate-exception", slash(exception.source), `Control exception ${exception.part} is duplicated.`);
        exceptionMap.set(key, exception);
    }
    const stringParts = (node: ts.Node, seen = new Set<ts.Symbol>()): string[] => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
        if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
        if (ts.isIdentifier(node)) {
            const symbol = checker.getSymbolAtLocation(node);
            if (!symbol || seen.has(symbol)) return [];
            seen.add(symbol);
            return (symbol.declarations || []).flatMap((declaration) => ts.isVariableDeclaration(declaration) && declaration.initializer
                ? stringParts(declaration.initializer, seen) : []);
        }
        const parts: string[] = [];
        ts.forEachChild(node, (child) => { parts.push(...stringParts(child, seen)); });
        return parts;
    };
    const attributeText = (attributes: ts.JsxAttributes, name: string, literalOnly = false) => {
        const attribute = attributes.properties.find((property): property is ts.JsxAttribute => ts.isJsxAttribute(property) && property.name.getText() === name);
        if (!attribute?.initializer) return "";
        if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
        const expression = ts.isJsxExpression(attribute.initializer) ? attribute.initializer.expression : undefined;
        if (!expression) return "";
        if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return expression.text;
        return literalOnly ? "" : stringParts(expression).join(" ");
    };
    const spreadProperties = (expression: ts.Expression, seen = new Set<ts.Symbol>()): string[] => {
        if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression) || ts.isSatisfiesExpression(expression))
            return spreadProperties(expression.expression, seen);
        if (ts.isConditionalExpression(expression)) return [...spreadProperties(expression.whenTrue, seen), ...spreadProperties(expression.whenFalse, seen)];
        if (ts.isObjectLiteralExpression(expression)) return expression.properties.flatMap((property) =>
            ts.isSpreadAssignment(property) ? spreadProperties(property.expression, seen)
                : property.name ? [ts.isStringLiteral(property.name) ? property.name.text : property.name.getText()] : []);
        if (ts.isIdentifier(expression)) {
            const symbol = checker.getSymbolAtLocation(expression);
            if (!symbol || seen.has(symbol)) return [];
            seen.add(symbol);
            return (symbol.declarations || []).flatMap((declaration) => ts.isVariableDeclaration(declaration) && declaration.initializer
                ? spreadProperties(declaration.initializer, seen) : []);
        }
        return [];
    };
    const ancestorNames = (node: ts.Node) => {
        const names = new Set<string>();
        for (let current: ts.Node | undefined = node; current; current = current.parent) {
            const scope = byDeclaration.get(current);
            if (scope) names.add(scope.name);
            if (ts.isFunctionExpression(current) && current.name) names.add(current.name.text);
        }
        return names;
    };
    const nearestScope = (node: ts.Node, implementationOnly = false) => {
        for (let current: ts.Node | undefined = node; current; current = current.parent) {
            const scope = byDeclaration.get(current);
            if (scope && (!implementationOnly || callable(scope))) return scope;
        }
        return undefined;
    };
    for (const [source, file] of sourceFiles) {
        if (!(source.startsWith("app/") || source.startsWith("components/")) || !source.endsWith(".tsx")) continue;
        const nextLinks = new Set(file.statements.filter(ts.isImportDeclaration)
            .filter((statement) => ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === "next/link")
            .map((statement) => statement.importClause?.name?.text).filter((name): name is string => !!name));
        const inspect = (node: ts.Node) => {
            if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
                const code = ts.isTemplateExpression(node) ? node.head.text + node.templateSpans.map(span => `__dynamic__${span.literal.text}`).join("") : node.text;
                if (/<[A-Z][A-Za-z]*\b/.test(code)) issues.push(...auditCopiedComponentCode(code, registry, source));
            }
            if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
                const tag = node.tagName.getText();
                const part = attributeText(node.attributes, "data-system-part", true);
                const key = exceptionKey(source, tag, part);
                const exception = exceptionMap.get(key);
                const accepted = exception && ancestorNames(node).has(exception.owner) && !!exception.reason.trim();
                if (accepted) matchedExceptions.add(key);
                const containingScope = nearestScope(node);
                const implementation = nearestScope(node, true);
                const product = containingScope && productScopes.has(containingScope);
                if (product) {
                    if (source !== "components/Icon.tsx" && (
                        tag === "svg" && /(?:^|\s)material-icon(?:\s|$)/.test(attributeText(node.attributes, "className")) ||
                        tag === "img" && /\/assets\/icons\/rounded\//.test(attributeText(node.attributes, "src"))
                    )) addIssue("raw-control-icon", source, "Use the registered Icon so glyphs inherit the control foreground in every state; authored SVG artwork remains allowed.", node);
                    const owned = implementation && nativeOwnership.get(implementation)?.has(tag);
                    if (nativeTags.has(tag) && !owned && !accepted)
                        addIssue("raw-control", source, `Raw <${tag}> must use the shared library or an exact documented data-system-part exception.`, node);
                    if ((tag === "a" || nextLinks.has(tag)) && /(?:^|\s)(?:button|ds-button)(?:\s|--|-|$)/.test(attributeText(node.attributes, "className")))
                        addIssue("raw-cta-link", source, `A raw CTA link with button classes must use SystemLink.`, node);
                }
                const targetScopes = referencedScopes(node.tagName);
                if (product && [...targetScopes].some((target) => /^System[A-Z]/.test(target.name))) {
                    const style = node.attributes.properties.find((property): property is ts.JsxAttribute => ts.isJsxAttribute(property) && property.name.getText() === "style");
                    const expression = style?.initializer && ts.isJsxExpression(style.initializer) ? style.initializer.expression : undefined;
                    const overrides = expression ? spreadProperties(expression).filter((property) =>
                        /^(?:border(?:TopLeft|TopRight|BottomLeft|BottomRight)?Radius|minHeight|height|padding(?:Top|Right|Bottom|Left|Inline(?:Start|End)?|Block(?:Start|End)?)?|fontSize|color|background(?:Color)?)$/.test(property)) : [];
                    if (overrides.length) addIssue("control-style-override", source, `Shared control ${tag} overrides ${sortStrings(overrides).join(", ")}; use a registered variant instead.`, node);
                }
                const isGlass = [...targetScopes].some((target) => target.source === "components/LiquidGlass.tsx") || tag === "LiquidGlass";
                const materialTool = documentationTools.some(tool => tool.id === "glass-demo" && tool.source === source)
                    && !product && source.startsWith("app/design-rules/_documentation/");
                if (isGlass && source !== "components/LiquidGlass.tsx" && !materialTool) {
                    const overrides = node.attributes.properties.flatMap((property) => ts.isJsxAttribute(property)
                        ? [property.name.getText()] : spreadProperties(property.expression))
                        .filter((property) => ["opacity", "refraction", "blur", "thickness"].includes(property));
                    if (overrides.length) addIssue("glass-override", source, `LiquidGlass material overrides (${sortStrings(overrides).join(", ")}) are reserved for LiquidGlassDemo; choose a registered variant.`, node);
                }
            }
            ts.forEachChild(node, inspect);
        };
        inspect(file);
    }
    for (const [key, exception] of exceptionMap) if (!matchedExceptions.has(key)) {
        addIssue("dangling-exception", slash(exception.source), `Exception ${exception.part} does not match a <${exception.tag}> marker inside ${exception.owner}.`);
    }

    // [현재 소스가 불러오는 CSS의 전역 토큰 검사 / Audit global tokens in CSS imported by active source]
    const cssFiles = new Map<string, string>();
    const loadCss = (target: string) => {
        const source = slash(relative(root, target));
        if (source.startsWith("../") || cssFiles.has(source) || !existsSync(target)) return;
        const content = readFileSync(target, "utf8");
        cssFiles.set(source, content);
        for (const match of content.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+\.css)["']/g)) {
            if (!/^(?:[a-z]+:|\/)/i.test(match[1])) loadCss(resolve(dirname(target), match[1]));
        }
    };
    const resolveLocal = (request: string, file: ts.SourceFile) => request.startsWith(".") ? resolve(dirname(file.fileName), request)
        : request.startsWith("@/") ? resolve(root, request.slice(2)) : undefined;
    const activeModules = new Set<ts.SourceFile>();
    const pendingModules = [...sourceFiles].filter(([source]) => source.startsWith("app/") && routeFile(source)).map(([, file]) => file);
    while (pendingModules.length) {
        const file = pendingModules.pop()!;
        if (activeModules.has(file)) continue;
        activeModules.add(file);
        for (const statement of file.statements) {
            if (!(ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
            if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly || ts.isExportDeclaration(statement) && statement.isTypeOnly) continue;
            const target = resolveLocal(statement.moduleSpecifier.text, file);
            if (!target) continue;
            const candidates = [target, `${target}.tsx`, `${target}.ts`, resolve(target, "index.tsx"), resolve(target, "index.ts")];
            const dependency = candidates.map((candidate) => sourceFiles.get(slash(relative(root, candidate)))).find(Boolean);
            if (dependency) pendingModules.push(dependency);
        }
    }
    for (const file of activeModules) for (const statement of file.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
        const request = statement.moduleSpecifier.text;
        const target = resolveLocal(request, file);
        if (request.endsWith(".css") && target) loadCss(target);
    }
    issues.push(...auditGlobalTokenDeclarations(cssFiles, new Set(canonicalTokens)));
    issues.sort((first, second) => first.source.localeCompare(second.source, "en") || (first.line || 0) - (second.line || 0) || first.code.localeCompare(second.code, "en") || first.message.localeCompare(second.message, "en"));
    return {
        issues, usage,
        counts: {
            total: registry.length,
            product: Object.values(usage).filter((item) => item.status === "product").length,
            documentationOnly: Object.values(usage).filter((item) => item.status === "guide-only").length,
            unused: Object.values(usage).filter((item) => item.status === "unused").length,
        },
    };
}

// [CSS의 중첩 블록과 전역 선택자 / Nested CSS blocks and global selectors]
export function auditGlobalTokenDeclarations(files: ReadonlyMap<string, string>, canonicalTokens: ReadonlySet<string>): AuditIssue[] {
    const issues: AuditIssue[] = [];
    for (const [source, original] of files) {
        if (source === "styles/tokens.css" || source.startsWith("styles/compat/")) continue;
        const css = original.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
        const blocks: string[] = [];
        let boundary = 0;
        let quote = "";
        for (let index = 0; index < css.length; index++) {
            const character = css[index];
            if (quote) {
                if (character === "\\") index++;
                else if (character === quote) quote = "";
                continue;
            }
            if (character === '"' || character === "'") { quote = character; continue; }
            if (character === "{") { blocks.push(css.slice(boundary, index).trim()); boundary = index + 1; }
            else if (character === ";" || character === "}") {
                const declaration = css.slice(boundary, index).match(/^\s*(--[\w-]+)\s*:/);
                const selector = [...blocks].reverse().find((block) => !block.startsWith("@")) || "";
                const global = selector.split(",").some((part) => {
                    const unwrapped = part.trim().replace(/:(?:where|is)\((:root|html|body|\*)\)/g, "$1");
                    return /^(?::root|html|body|\*)(?=$|[\[.:#])/.test(unwrapped)
                        && !/[ >+~]/.test(unwrapped.replace(/\[[^\]]*\]|\([^)]*\)/g, ""));
                });
                if (declaration && canonicalTokens.has(declaration[1]) && global) {
                    issues.push({ code: "duplicate-global-token", source, line: css.slice(0, boundary).split("\n").length,
                        message: `Canonical token ${declaration[1]} is redeclared globally in ${selector}; edit design-tokens.ts instead.` });
                }
                if (character === "}") blocks.pop();
                boundary = index + 1;
            }
        }
    }
    return issues;
}

// [타임스탬프 없는 사용처 모듈 / Usage module without timestamps]
export function renderComponentUsage(result: Pick<AuditResult, "usage" | "counts">): string {
    return `// [컴포넌트 사용처의 생성 자료 / Generated component usage]\n// scripts/audit-component-system.ts --write로 갱신합니다. / Regenerate with scripts/audit-component-system.ts --write.\nexport const COMPONENT_USAGE = ${JSON.stringify(result.usage, null, 4)} as const;\n\nexport const COMPONENT_COUNTS = ${JSON.stringify(result.counts, null, 4)} as const;\n`;
}

export function syncComponentUsage(result: Pick<AuditResult, "usage" | "counts">, target: string | URL, { check = false }: { check?: boolean } = {}): boolean {
    const expected = renderComponentUsage(result);
    if (existsSync(target) && normalized(readFileSync(target, "utf8")) === expected) return true;
    if (check) return false;
    mkdirSync(dirname(target instanceof URL ? fileURLToPath(target) : target), { recursive: true });
    writeFileSync(target, expected, "utf8");
    return true;
}

// [CLI에서는 검증 성공 후에만 메타데이터 갱신 / Update CLI metadata only after a successful audit]
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const { COMPONENT_REGISTRY, CONTROL_EXCEPTIONS } = await import("../src/data/component-registry.ts");
    const { CHAPTERS } = await import("../src/data/design-system.ts");
    const { DESIGN_TOKEN_VALUES } = await import("../src/data/design-tokens.ts");
    const { DOCUMENTATION_TOOLS } = await import("../app/design-rules/_documentation/tools.ts");
    const result = auditComponentSystem({ root: fileURLToPath(new URL("..", import.meta.url)), registry: COMPONENT_REGISTRY,
        exceptions: CONTROL_EXCEPTIONS, chapters: CHAPTERS, canonicalTokens: Object.keys(DESIGN_TOKEN_VALUES), enforceIdentity: true,
        requireProductUsage: true, documentationTools: DOCUMENTATION_TOOLS });
    const args = process.argv.slice(2);
    if (args.some((argument) => !["--check", "--write"].includes(argument)) || args.includes("--check") && args.includes("--write")) {
        console.error("Usage: node scripts/audit-component-system.ts [--check | --write]");
        process.exitCode = 2;
    } else if (result.issues.length) {
        for (const issue of result.issues) console.error(`${issue.source}${issue.line ? `:${issue.line}` : ""} [${issue.code}] ${issue.message}`);
        process.exitCode = 1;
    } else if (!syncComponentUsage(result, new URL("../src/data/component-usage.ts", import.meta.url), { check: !args.includes("--write") })) {
        console.error("Component usage is stale. Run node scripts/audit-component-system.ts --write.");
        process.exitCode = 1;
    } else {
        console.log(`Component system: ${result.counts.total} registered; ${result.counts.product} product, ${result.counts.documentationOnly} guide-only, ${result.counts.unused} unused.`);
    }
}
