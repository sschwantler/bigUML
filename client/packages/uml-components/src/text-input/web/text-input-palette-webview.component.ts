/*********************************************************************************
 * Copyright (c) 2023 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import {
    ActionMessageNotification,
    ElementProperties,
    ModelResourcesResponseAction,
    RefreshPropertyPaletteAction,
    SetPropertyPaletteAction,
    BGModelResource
} from '@borkdominik-biguml/uml-protocol';
import { Action, ActionMessage, SelectAction } from '@eclipse-glsp/protocol';
import { TemplateResult, html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { HOST_EXTENSION } from 'vscode-messenger-common';
import { BigElement } from '../../base/component';
import { useToolkit } from '../../toolkit';
import { messenger } from '../../vscode/messenger';
import { TextInputPalette } from '../text-input-palette.component';

export function defineTextInputPaletteWebview(): void {
    customElements.define('big-text-input-palette-webview', TextInputPaletteWebview);
}

export class TextInputPaletteWebview extends BigElement {
    @query('#component')
    protected readonly component: TextInputPalette;

    @state()
    protected elementProperties?: ElementProperties;
    protected clientId?: string;
    @state()
    protected umlModel?: BGModelResource;
    @state()
    protected unotationModel?: BGModelResource;

    override connectedCallback(): void {
        super.connectedCallback();
        useToolkit();

        document.addEventListener('contextmenu', event => {
            event.stopImmediatePropagation();
        });

        messenger.onNotification<ActionMessage>(ActionMessageNotification, message => {
            const { clientId, action } = message;

            console.log("####GOT IT");
            console.log(action.kind);

            if (SetPropertyPaletteAction.is(action)) {
                this.clientId = clientId;
                this.elementProperties = action.palette;
                
            } else if (ModelResourcesResponseAction.is(action)) {
                this.umlModel = action.resources.uml as BGModelResource;
                this.unotationModel = action.resources.unotation as BGModelResource;
            } else if (SelectAction.is(action)) {
                
            } else {
                console.warn('Unsupported action', action);
            }

            console.log(this.elementProperties);
            console.log(this.clientId);
        });
        messenger.start();

        this.sendNotification(RefreshPropertyPaletteAction.create());
        this.sendNotification({ kind: 'requestModelResources' });
    }

    protected override render(): TemplateResult<1> {
        return html`<big-text-input-palette
            id="component"
            .clientId="${this.clientId}"
            .properties="${this.elementProperties}"
            .umlModel="${this.umlModel}"
            .unotationModel="${this.unotationModel}"
            @dispatch-action="${this.onDispatchAction}"
        ></big-text-input-palette>`;
    }

    protected onDispatchAction(event: CustomEvent<Action>): void {
        this.sendNotification(event.detail);
    }

    protected sendNotification(action: Action): void {

        messenger.sendNotification(ActionMessageNotification, HOST_EXTENSION, {
            clientId: this.clientId,
            action
        });
    }
}
