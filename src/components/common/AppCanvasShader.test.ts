import { describe, it, expect } from 'vitest';
import React from 'react';
import { AppCanvasShader } from './AppCanvasShader';

describe('AppCanvasShader Component', () => {
  it('instantiates valid React element for AppCanvasShader', () => {
    const el = React.createElement(AppCanvasShader);
    expect(React.isValidElement(el)).toBe(true);
  });
});
