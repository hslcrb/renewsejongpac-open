import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginName = 'ReadableProductionAssets';

export function sourceLabel(resource: string, root: string): string {
    const clean = resource.replaceAll('\\', '/').split('!').at(-1)!.split('?')[0];
    const nodeModules = clean.lastIndexOf('/node_modules/');
    if (nodeModules !== -1) return 'vendor/' + clean.slice(nodeModules + 14);
    const relative = path.relative(root, clean).replaceAll('\\', '/');
    if (!relative.startsWith('../') && !/^[A-Za-z]:/.test(relative)) return relative;
    return 'runtime/' + path.posix.basename(clean).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function moduleSources(module: any, root: string, result: Set<string>): void {
    const resource = module.resource || module.nameForCondition?.();
    if (resource) result.add(sourceLabel(resource, root));
    if (module.modules) for (const child of module.modules) moduleSources(child, root, result);
}

function safeStem(source: string): string {
    return source.replace(/\.(?:[cm]?[jt]sx?|css)$/, '').replace(/[^a-zA-Z0-9_./-]/g, '_').replace(/\.{2,}/g, '_');
}

export function configureReadableBuild(config: any, context: any, releaseId: string, root: string): any {
    if (context.dev || context.isServer) return config;
    const webpack = context.webpack;
    const chunkMetadata = new WeakMap<object, { stem: string; sourceFiles: string[] }>();
    const prefix = `static/${releaseId}/`;
    const filename = (extension: string) => (data: any) => {
        const item = chunkMetadata.get(data.chunk);
        if (!item) throw new Error(`Missing readable source identity for chunk ${data.chunk?.name}`);
        return prefix + item.stem + '.' + extension;
    };
    config.optimization.minimize = false;
    config.devtool = 'source-map';
    config.output.filename = filename('js');
    config.output.chunkFilename = filename('js');
    config.output.devtoolModuleFilenameTemplate = (info: any) => 'webpack://sejong-v5/' + sourceLabel(info.absoluteResourcePath || info.resourcePath, root);
    config.output.devtoolFallbackModuleFilenameTemplate = (info: any) => 'webpack://sejong-v5/' + sourceLabel(info.absoluteResourcePath || info.resourcePath, root) + '?variant=' + info.hash;
    function enableCssSourceMaps(rule: any): void {
        for (const child of [...(rule.oneOf || []), ...(rule.rules || [])]) enableCssSourceMaps(child);
        for (const loader of Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : []) {
            if (typeof loader === 'object' && /[\\/](?:css-loader|postcss-loader)[\\/]/.test(loader.loader || '')) loader.options = { ...loader.options, sourceMap: true };
        }
    }
    for (const rule of config.module.rules) enableCssSourceMaps(rule);
    const originalEntry = config.entry;
    config.entry = async () => {
        const entries = typeof originalEntry === 'function' ? await originalEntry() : originalEntry;
        const main = entries['main-app'];
        const replace = (value: string) => /(?:^|\/)app-next\.js$/.test(value.replaceAll('\\', '/')) ? path.join(toolRoot, 'src/runtime/readable-app.ts') : value;
        if (Array.isArray(main)) entries['main-app'] = main.map(replace);
        else if (typeof main === 'string') entries['main-app'] = replace(main);
        else if (main?.import) entries['main-app'] = { ...main, import: Array.isArray(main.import) ? main.import.map(replace) : replace(main.import) };
        else throw new Error('Next main-app entry shape changed');
        return entries;
    };
    for (const plugin of config.plugins) {
        if (plugin?.constructor?.name === 'NextMiniCssExtractPlugin') {
            plugin.options.filename = filename('css');
            plugin.options.chunkFilename = filename('css');
        }
        if (plugin?.constructor?.name === 'CopyFilePlugin' && /polyfill/.test(plugin.filePath || '')) {
            plugin.name = prefix + 'vendor/next/polyfills_1.js';
            plugin.cacheKey = `next-14.2.35-readable-v1-${releaseId}`;
        }
    }
    config.plugins.push({
        apply(compiler: any) {
            compiler.hooks.thisCompilation.tap(pluginName, (compilation: any) => {
                compilation.hooks.beforeChunkIds.tap(pluginName, (chunks: Iterable<any>) => {
                    const items = [...chunks].map(chunk => {
                        const sources = new Set<string>();
                        for (const module of compilation.chunkGraph.getChunkModulesIterable(chunk)) moduleSources(module, root, sources);
                        const sourceFiles = [...sources].sort();
                        if (!sourceFiles.length) sourceFiles.push(chunk.name?.startsWith('app/') ? chunk.name + '.tsx' : 'runtime/' + (chunk.name || 'webpack-generated'));
                        const own = sourceFiles.filter(source => !source.startsWith('vendor/') && !source.startsWith('runtime/'));
                        const named = chunk.name && !/^[0-9a-f-]+$/.test(chunk.name) ? chunk.name : null;
                        const representative = named?.startsWith('app/') ? named : own[0] || (named ? 'runtime/' + named : sourceFiles[0] || 'runtime/shared');
                        return { chunk, sourceFiles, base: safeStem(representative), key: sourceFiles.join('\0') + '\0' + (chunk.name || '') };
                    }).sort((a, b) => a.base.localeCompare(b.base) || a.key.localeCompare(b.key));
                    const counts = new Map<string, number>();
                    for (const item of items) {
                        const suffix = (counts.get(item.base) || 0) + 1;
                        counts.set(item.base, suffix);
                        chunkMetadata.set(item.chunk, { stem: item.base + '_' + suffix, sourceFiles: item.sourceFiles });
                    }
                });
                // Beautify delivered code, including Next's already-minified
                // no-module polyfill, while composing the original source maps.
                compilation.hooks.processAssets.tapPromise({ name: pluginName, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE }, async () => {
                    const { minify } = require('next/dist/compiled/terser');
                    for (const asset of compilation.getAssets()) {
                        if (asset.name.endsWith('.css')) {
                            const postcss = require('postcss');
                            const original = asset.source.sourceAndMap();
                            const tree = postcss.parse(original.source.toString(), { from: asset.name, map: { prev: original.map || false } });
                            tree.walk((node: any) => {
                                let depth = 0;
                                for (let parent = node.parent; parent && parent.type !== 'root'; parent = parent.parent) depth++;
                                node.raws.before = '\n' + '    '.repeat(depth);
                                if (node.type === 'decl') node.raws.between = ': ';
                                if (node.nodes) { node.raws.between = ' '; node.raws.after = '\n' + '    '.repeat(depth); node.raws.semicolon = true; }
                            });
                            tree.raws.after = '\n';
                            const result = tree.toResult({ to: asset.name, map: { inline: false, annotation: false } });
                            compilation.updateAsset(asset.name, new webpack.sources.SourceMapSource(result.css, asset.name, result.map.toJSON()), { ...asset.info, minimized: false });
                            continue;
                        }
                        if (!asset.name.endsWith('.js')) continue;
                        const original = asset.source.sourceAndMap();
                        const result = await minify({ [asset.name]: original.source.toString() }, {
                            compress: false, mangle: false,
                            format: { beautify: true, indent_level: 4, comments: 'all' },
                            sourceMap: { content: original.map || undefined, asObject: true, filename: asset.name },
                        });
                        compilation.updateAsset(asset.name, new webpack.sources.SourceMapSource(result.code, asset.name, result.map, original.source, original.map, true), { ...asset.info, minimized: false });
                    }
                });
                compilation.hooks.processAssets.tap({ name: pluginName + 'Manifest', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, () => {
                    const assets: Record<string, { sourceFiles: string[]; routes: string[] }> = {};
                    for (const chunk of compilation.chunks) {
                        const metadata = chunkMetadata.get(chunk);
                        if (!metadata) continue;
                        const routes = new Set<string>();
                        const seen = new Set<any>();
                        function visit(group: any) {
                            if (seen.has(group)) return;
                            seen.add(group);
                            if (group.name?.startsWith('app/')) routes.add(group.name);
                            for (const parent of group.parentsIterable || []) visit(parent);
                        }
                        for (const group of chunk.groupsIterable) visit(group);
                        for (const file of [...chunk.files, ...chunk.auxiliaryFiles]) assets[file] = { sourceFiles: metadata.sourceFiles, routes: [...routes].sort() };
                    }
                    assets[prefix + 'vendor/next/polyfills_1.js'] = { sourceFiles: ['vendor/next/dist/build/polyfills/polyfill-nomodule.js'], routes: ['*'] };
                    compilation.emitAsset('readable-webpack-manifest.json', new webpack.sources.RawSource(JSON.stringify({ schemaVersion: 1, releaseId, assets }, null, 4)));
                });
            });
        },
    });
    return config;
}
