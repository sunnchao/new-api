import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

function declarationsFor(root, selector) {
  const declarations = new Map();
  root.walkRules(selector, (rule) => {
    rule.walkDecls((decl) => {
      declarations.set(decl.prop, decl.value);
    });
  });
  return declarations;
}

test('public layout owns vertical scrolling while desktop body scroll is locked', () => {
  const cssPath = path.resolve('src/index.css');
  const cssRoot = postcss.parse(fs.readFileSync(cssPath, 'utf8'), {
    from: cssPath,
  });
  const appLayout = declarationsFor(cssRoot, '.app-layout');
  const pageLayoutSource = fs.readFileSync(
    path.resolve('src/components/layout/PageLayout.jsx'),
    'utf8',
  );

  assert.match(
    appLayout.get('height') || '',
    /100d?vh/,
    'app layout should be constrained to viewport height so it can scroll internally',
  );
  assert.match(
    pageLayoutSource,
    /overflow:\s*isFixedLayout && !isMobile \? 'hidden' : 'auto'/,
    'public routes should use the app layout as their scroll container',
  );
});
