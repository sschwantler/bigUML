/*********************************************************************************
 * Copyright (c) 2023 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import {
    ElementProperties,
    ElementProperty,
    ElementReferenceProperty,
    ElementTextProperty,
    UpdateElementPropertyAction
} from '@borkdominik-biguml/uml-protocol';
import { Action, CreateNodeOperation, CreateEdgeOperation, DeleteElementOperation } from '@eclipse-glsp/protocol';
import { TextField as VSCodeTextField } from '@vscode/webview-ui-toolkit';
import { PropertyValues, TemplateResult, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { BigElement } from '../base/component';
import '../global';
import { TextInputDeleteEventDetail, TextInputNameChangeDetail, TextInputOrderDetail } from './reference/text-input-palette-reference.component';
import { TextInputPaletteStyle } from './text-input-palette.style';

export function defineTextInputPalette(): void {
    customElements.define('big-text-input-palette', TextInputPalette);
}

export class TextInputPalette extends BigElement {
    static override styles = [...super.styles, TextInputPaletteStyle.style];

    @property()
    clientId?: string;

    @property({ type: Object })
    properties?: ElementProperties;

    @state() inputText = '...';

    @state()
    protected navigationIds: { [key: string]: { from: string; to: string }[] } = {};

    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: BlobPart[] = [];

    protected override render(): TemplateResult<1> {
        return html`<div>${this.headerTemplate()} ${this.bodyTemplate()}</div>`;
    }

    protected override updated(changedProperties: PropertyValues<this>): void {
        if (changedProperties.has('properties') && this.clientId !== undefined) {
            const ids = this.navigationIds[this.clientId];

            if (this.properties === undefined || ids?.at(-1)?.to !== this.properties.elementId) {
                this.navigationIds[this.clientId] = [];
            }
        }
    }

    protected headerTemplate(): TemplateResult<1> {
        return html`<header>Text Input Field</header>`;
    }

    protected bodyTemplate(): TemplateResult<1> {
        return this.textFieldWithButtonTemplate();
    }

    protected async onRecordAudio(): Promise<void> {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Audio recording not supported in this environment');
            return;
        }

        try {
            // fixme: Permissions policy violation: microphone is not allowed in this document.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.start();
            console.info("Recording started...");

            // Automatically stop recording after 5 seconds
            setTimeout(() => {
                this.stopRecording();
            }, 5000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    }

    protected async stopRecording(): Promise<void> {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.audioChunks = [];  // Clear the chunks array for the next recording

                console.log("Recording stopped.");
                await this.transcribeAudio(audioBlob);
            };
        }
    }

    protected async transcribeAudio(audioBlob: Blob): Promise<void> {
        const formData = new FormData();
        formData.append("file", new File([audioBlob], "recording.wav"));

        try {
            const response = await fetch('http://localhost:8000/transcribe/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Transcription: ${data.transcription}`);
            this.inputText = data.transcription;

        } catch (error) {
            console.error("Error transcribing audio:", error);
        }
    }

    protected async onStartIntent(): Promise<void> {
        console.log("onStartIntent");
        console.log(this.properties);
        console.log(this.navigationIds);

        const response = await fetch(`http://127.0.0.1:8000/intent/?user_query=${this.inputText}`, {
            headers: {
                accept: 'application/json'
            }
        })
        if (!response.ok) {
            console.error(response.text)
        }
        const json = await response.json();
        this.handleIntent(json.intent)
    }

    protected async handleIntent(intent: string) {
        enum Intents {
            CREATE_CLASS = "CreateClass",
            ADD_ATTRIBUTE = "AddAttribute",
            ADD_METHOD = "AddMethod",
            CHANGE_NAME_INTENT = "ChangeName",
            CHANGE_VISIBILITY_INTENT = "ChangeVisibility",
            CHANGE_DATATYPE_INTENT = "ChangeDatatype",
            CREATE_RELATION = "AddRelation",
            DELETE_INTENT = "Delete"
        }

        console.log(intent);

        switch(intent) {
            case Intents.CREATE_CLASS: {
                this.createClass();
                break;
            }
            case Intents.ADD_ATTRIBUTE: {
                if (this.properties?.elementId == null) {
                    console.error("Nothing selected");
                    return;
                }
                this.addAttribute();
                break;
            }
            case Intents.ADD_METHOD: {
                if (this.properties?.elementId == null) {
                    console.error("Nothing selected");
                    return;
                }
                this.addMethod();
                break;
            }
            case Intents.CHANGE_NAME_INTENT: {
                if (this.properties?.elementId == null) {
                    console.error("Nothing selected");
                    return;
                }
                // TODO implement
                break;
            }
            case Intents.CREATE_RELATION: {
                this.createRelation();
                break;
            }
            case Intents.DELETE_INTENT: {
                if (this.properties?.elementId == null) {
                    console.error("Nothing selected");
                    return;
                }
                this.deleteElement();
                break;
            }
            default: {
                console.log("Buhu ;(");
            }
            // todo set focus on created relation
        }
    }

    protected async createClass() {
        const response = await fetch(`http://127.0.0.1:8000/create-class/?user_query=${this.inputText}`, {
            headers: {
                accept: 'application/json'
            },
            method: "POST"
        });
        if (!response.ok) {
            console.error(response.text);
        }
        const json = await response.json();
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(json.is_abstract ? `CLASS__AbstractClass` : `CLASS__Class`, 
                {
                    containerId: "_Ixd8AN8LEe6XScRLwR9PWg",
                    location: {
                        x: 0,
                        y: 0
                    },
                    args: {
                        name: json.class_name,
                        isAbstract: json.is_abstract
                    }
                })
            })
        );
    }

    // abstract parent for addAttribute and addMethod
    protected async addValue() {
        const response = await fetch(`http://127.0.0.1:8000/add-value/?user_query=${this.inputText}`, {
            headers: {
                accept: 'application/json'
            },
            method: "POST"
        });
        if (!response.ok) {
            console.error(response.text);
        }
        return await response.json();
    }

    protected async addAttribute() {
        const json = await this.addValue();
        // todo destinguish between method param and class param
        
        /*
        if method param:
            this.dispatchEvent(
                new CustomEvent<Action>('dispatch-action', {
                    detail: event.detail.action
                })
            );
        */

        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(`CLASS__Property`, 
                {
                    containerId: this.properties?.elementId,
                    args: {
                        name: json.value_name,
                        datatype: json.value_datatype,
                        visibility: json.value_visibility
                    }
                })
            })
        );
    }

    protected async addMethod() {
        const json = await this.addValue();
        // no return type
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(`CLASS__Operation`, 
                {
                    containerId: this.properties?.elementId,
                    args: {
                        name: json.value_name,
                        visibility: json.value_visibility
                    }
                })
            })
        );
    }

    protected async createRelation() {
        const response = await fetch(`http://127.0.0.1:8000/add-relation/?user_query=${this.inputText}`, {
            headers: {
                accept: 'application/json'
            },
            method: "POST",
            // todo requires current model .uml + .unotation
        });
        if (!response.ok) {
            console.error(response.text);
        }
        const json = await response.json();
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateEdgeOperation.create( 
                {
                    elementTypeId: "CLASS__" + json.realation_type,
                    sourceElementId: json.class_from_id,
                    targetElementId: json.class_to_id,
                    args: {}
                })
            })
        );
    }

    protected async deleteElement() {
        const elementIdString = this.properties?.elementId;
        const elementIdList: string[] = elementIdString ? [elementIdString] : [];
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: DeleteElementOperation.create(elementIdList, {})
            })
        );
    }

    protected textFieldWithButtonTemplate(): TemplateResult<1> {
        return html`
            <div class="grid-value grid-flex">
                <vscode-text-field .value="${this.inputText}" @input="${(event: any) => (this.inputText = event.target?.value)}"></vscode-text-field>
                <vscode-button appearance="primary" @click="${this.onStartIntent}"> Send </vscode-button>
                <vscode-button appearance="primary" @click="${this.onRecordAudio}"> Record </vscode-button>
            </div>
        `
    }

    protected textFieldTemplate(item: ElementTextProperty): TemplateResult<1> {
        const onChange = (event: CustomEvent): void => {
            const target = event.target as VSCodeTextField;
            this.onPropertyChange(item, target.value);
        };

        return html`<div class="grid-label">${item.label}</div>
            <div class="grid-value grid-flex">
                <vscode-text-field .value="${item.text}" @change="${onChange}" ?disabled="${item.disabled}"></vscode-text-field>
            </div>`;
    }

    protected onPropertyChange(item: ElementProperty, value: string): void {
        const { elementId, propertyId } = item;

        this.dispatchEvent(
            new CustomEvent<Action>('dispatch-action', {
                detail: UpdateElementPropertyAction.create({
                    elementId,
                    propertyId,
                    value
                })
            })
        );
    }

    protected onOrderChange(event: CustomEvent<TextInputOrderDetail>): void {
        const { element, updates } = event.detail;

        this.dispatchEvent(
            new CustomEvent<Action>('dispatch-action', {
                detail: UpdateElementPropertyAction.create({
                    elementId: element.elementId,
                    propertyId: `${element.propertyId}_index`,
                    value: JSON.stringify(updates)
                })
            })
        );
    }

    protected onPropertyNameChange(event: CustomEvent<TextInputNameChangeDetail>): void {
        const { elementId, name } = event.detail;

        this.dispatchEvent(
            new CustomEvent<Action>('dispatch-action', {
                detail: UpdateElementPropertyAction.create({
                    elementId,
                    propertyId: 'name',
                    value: name
                })
            })
        );
    }

    protected onPropertyCreate(event: CustomEvent<ElementReferenceProperty.CreateReference>): void {
        this.dispatchEvent(
            new CustomEvent<Action>('dispatch-action', {
                detail: event.detail.action
            })
        );
    }

    protected onPropertyDelete(event: CustomEvent<TextInputDeleteEventDetail>): void {
        this.dispatchEvent(
            new CustomEvent<Action[]>('dispatch-action', {
                detail: event.detail.references.flatMap(r => r.deleteActions)
            })
        );
    }
}
