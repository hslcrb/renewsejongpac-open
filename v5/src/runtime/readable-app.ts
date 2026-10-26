// This must run first: it installs Next's chunk loading and public-path setup.
import 'next/dist/client/app-webpack';
import { restoreReadableDocument } from './readable-dom';

function startApplication(): void {
    restoreReadableDocument(document);
    // A literal require is bundled synchronously. Flight pushes stay queued
    // until app-index installs its consumer after the complete DOM is restored.
    require('next/dist/client/app-next');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApplication, { once: true });
} else {
    startApplication();
}
