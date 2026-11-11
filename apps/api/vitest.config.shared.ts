import swc from 'unplugin-swc';

export const swcPlugin = swc.vite({
  module: { type: 'es6' },
  jsc: {
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
  },
});
