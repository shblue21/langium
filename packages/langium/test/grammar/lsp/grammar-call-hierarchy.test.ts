/******************************************************************************
 * Copyright 2026 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { EmptyFileSystem } from 'langium';
import { createLangiumGrammarServices } from 'langium/grammar';
import { parseHelper } from 'langium/test';
import { describe, expect, test } from 'vitest';

describe('LangiumGrammarCallHierarchyProvider', () => {
    test('should resolve hierarchy items to the declaration document', async () => {
        const services = createLangiumGrammarServices(EmptyFileSystem).grammar;
        const parse = parseHelper(services);
        const target = await parse(`
            grammar Target
            Callee: name='x';
            entry TargetRule: callee=Callee;
        `, { documentUri: 'file:///target.langium' });
        const sourceText = `
            grammar Source
            import "./target"
            entry Root: target=TargetRule;
        `;
        const source = await parse(sourceText, { documentUri: 'file:///source.langium' });
        const provider = services.lsp.CallHierarchyProvider!;

        const items = await provider.prepareCallHierarchy(source, {
            textDocument: { uri: source.textDocument.uri },
            position: source.textDocument.positionAt(sourceText.indexOf('TargetRule'))
        });

        expect(items).toHaveLength(1);
        const item = items![0];
        expect(item.uri).toBe(target.textDocument.uri);
        const incoming = await provider.incomingCalls({ item });
        expect(incoming?.map(call => call.from.name)).toStrictEqual(['Root']);
    });
});
