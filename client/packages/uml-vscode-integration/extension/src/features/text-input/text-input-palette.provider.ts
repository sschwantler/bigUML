/*********************************************************************************
 * Copyright (c) 2023 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

// import { RefreshPropertyPaletteAction, SetPropertyPaletteAction } from '@borkdominik-biguml/uml-protocol';
import { injectable, postConstruct } from 'inversify';
import { VSCodeSettings } from '../../language';
import { getBundleUri, getUri } from '../../utilities/webview';
import { ProviderWebviewContext, UMLWebviewProvider } from '../../vscode/webview/webview-provider';
import { InitializeCanvasBoundsAction, SetViewportAction } from '@eclipse-glsp/client';
import { MinimapExportSvgAction, ModelResourcesResponseAction, RequestMinimapExportSvgAction, RequestModelResourcesAction, SetPropertyPaletteAction } from '@borkdominik-biguml/uml-protocol';


@injectable()
export class TextInputPaletteProvider extends UMLWebviewProvider {
    get id(): string {
        return VSCodeSettings.textInputPalette.viewId;
    }

    protected override retainContextWhenHidden = true;

    @postConstruct()
    override init(): void {
        super.init();
        this.extensionHostConnection.cacheActions([InitializeCanvasBoundsAction.KIND, SetViewportAction.KIND, MinimapExportSvgAction.KIND, SetPropertyPaletteAction.KIND]);
    }

    protected resolveHTML(providerContext: ProviderWebviewContext): void {
        const webview = providerContext.webviewView.webview;
        const extensionUri = this.extension.extensionUri;

        const codiconsCSSUri = getUri(webview, extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);
        const bundleJSUri = getBundleUri(webview, extensionUri, ['text-input-palette', 'bundle.js']);

        webview.html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
         
            <link id="codicon-css" href="${codiconsCSSUri}" rel="stylesheet" />
            <title>Text Input Palette</title>
        </head>
        <body>
            <big-text-input-palette-webview></big-text-input-palette-webview>
            <script type="module" src="${bundleJSUri}"></script>
        </body>
        </html>`;
    }

    protected override handleConnection(): void {
        // ==== Webview Extension Host ====
        this.extensionHostConnection.onActionMessage(message => {
            if (ModelResourcesResponseAction.is(message.action)) {
                // =============== FORWARD DATA TO WEBVIEW ===============
                console.log('ModelResourcesResponseAction', message.action);
                this.webviewViewConnection.send(message.action);
                this.extensionHostConnection.send(RequestMinimapExportSvgAction.create());
            }
        });

        // ==== Webview View Connection ====
        this.webviewViewConnection.onActionMessage(message => {
            console.log("webviewViewConnection.onActionMessage", message.action);
            if (message.action.kind === 'textInputReady') {
                                // =============== REQUEST MODEL RESOURCES ===============
                this.extensionHostConnection.send(RequestMinimapExportSvgAction.create()); // 
                this.extensionHostConnection.send(RequestModelResourcesAction.create());
                this.extensionHostConnection.forwardCachedActionsToWebview();
            } else {
                this.extensionHostConnection.send(message.action);
            }
        });
    }

}
