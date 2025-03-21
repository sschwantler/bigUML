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
    BGModelResource,
    ElementProperties,
    ExportHistoryAction,
    NliErrorAction,
    UpdateElementPropertyAction
} from '@borkdominik-biguml/uml-protocol';
import { Action, ChangeBoundsOperation, CreateEdgeOperation, CreateNodeOperation, DeleteElementOperation, Dimension, ElementAndBounds, SelectAction, UndoAction } from '@eclipse-glsp/protocol';
import { PropertyValues, TemplateResult, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { HOST_EXTENSION } from 'vscode-messenger-common';
import { BigElement } from '../base/component';
import '../global';
import { messenger } from '../vscode/messenger';
import { TextInputPaletteStyle } from './text-input-palette.style';
import { NLI_SERVER_URL, SHOW_NLI_UI } from './index';

const umlTypesMap = new Map<string, string>([
    ["class", "CLASS__Class"],
    ["interface", "CLASS__Interface"],
    ["data type", "CLASS__DataType"],
    ["datatype", "CLASS__DataType"],
    ["type", "CLASS__DataType"],
    ["enumeration", "CLASS__Enumeration"],
    ["instance", "CLASS__Instance"],
    ["package", "CLASS__Package"],
    ["primitive type", "CLASS__PrimitiveType"],
    ["primitive datatype", "CLASS__PrimitiveType"],
    ["primitive data type", "CLASS__PrimitiveType"]
]);

export function defineTextInputPalette(): void {
    customElements.define('big-text-input-palette', TextInputPalette);
}

export class TextInputPalette extends BigElement {
    static override styles = [...super.styles, TextInputPaletteStyle.style];

    @property()
    clientId?: string;

    @property({ type: Object })
    properties?: ElementProperties;

    @property({ type: Object })
    protected umlModel?: BGModelResource;
    @property({ type: Object })
    protected unotationModel?: BGModelResource;
    @property({ type: Object })
    inputText: string = '...';
    @property({ type: Object })
    programmaticChange: boolean = false;
    @property({ type: Object })
    recordingTimestamp: string;
    @property({ type: Map })
    private inputHistory = new Map<string, string>();

    @state()
    protected navigationIds: { [key: string]: { from: string; to: string }[] } = {};

    protected override render(): TemplateResult<1> {
        if (SHOW_NLI_UI) {
            return html`<div>${this.headerTemplate()} ${this.bodyTemplate()}</div>`;
        }
        return html`<div></div>`;
    }

    protected override updated(changedProperties: PropertyValues<this>): void {
        if (changedProperties.has('properties') && this.clientId !== undefined) {
            const ids = this.navigationIds[this.clientId];

            if (this.properties === undefined || ids?.at(-1)?.to !== this.properties.elementId) {
                this.navigationIds[this.clientId] = [];
            }
        }
        if (changedProperties.has('inputText') && this.programmaticChange) {
            if (this.inputText) {
                this.onStartIntent().then(result => this.programmaticChange = false);
            }
        }

        this.resetRecordButton();
    }

    protected headerTemplate(): TemplateResult<1> {
        return html`<header></header>`;
    }

    protected bodyTemplate(): TemplateResult<1> {
        return this.textFieldWithButtonTemplate();
    }

    protected async clearInput() {
        this.inputText = "";
    }

    handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        this.inputText = target.value;
    }

    selectHistoryEntry(entry: string) {
        this.inputText = entry;
    }

    protected async onRecordActionMessageStart(): Promise<void> {

        if (!await this.isNliServerRunning()) {
            this.showErrorMsg("NLI Server not ready, make sure it is running at " + NLI_SERVER_URL);
            return;
        }

        const recordButton = this.renderRoot.querySelector('#recordButton') as HTMLElement;

        if (recordButton) {
            recordButton.setAttribute('disabled', 'true');
            recordButton.textContent = 'Recording...';
        }
        this.sendNotification({ kind: 'startRecording' });
    }

    protected async onStartIntent(): Promise<void> {
        try {
            if (!this.inputText) {
                this.showErrorMsg("Input text is empty, nothing todo");
                return;
            }

            if (!await this.isNliServerRunning()) {
                this.showErrorMsg("NLI Server not ready, make sure it is running at " + NLI_SERVER_URL);
                return;
            }
            
            if (!this.programmaticChange) {
                this.recordingTimestamp = "text-input-" + Date.now().toString();
            }
            this.inputHistory.set(this.recordingTimestamp, this.inputText);

            const intent = await this.getIntent();

            await this.handleIntent(intent);
        } catch (error) {
            let errorMessage = "Unknown error occurred.";

            if (error instanceof Error) {
                errorMessage = error.message || error.toString();
            }

            this.showErrorMsg(errorMessage);

        } finally {
            this.resetRecordButton();
            this.sendNotification(ExportHistoryAction.create(this.inputHistory));

            await this.sleep(1000); // this is the most hacky solution ever to delay the update until the server did the change

            console.log("Sending Notification from component");
            this.sendNotification({ kind: 'requestModelResources' });
        }
    }

    protected async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    protected async resetRecordButton() {
        const recordButton = this.renderRoot.querySelector('#recordButton') as HTMLElement;
        if (recordButton) {
            recordButton.removeAttribute('disabled');
            recordButton.textContent = 'Start Recording';
        }
    }

    protected async handleIntent(intent: string) {
        enum Intents {
            CREATE_CONTAINER = "CreateContainer",
            ADD_ATTRIBUTE = "AddAttribute",
            ADD_METHOD = "AddMethod",
            CHANGE_NAME_INTENT = "ChangeName",
            CHANGE_VISIBILITY_INTENT = "ChangeVisibility",
            CHANGE_DATATYPE_INTENT = "ChangeDatatype",
            CREATE_RELATION = "AddRelation",
            DELETE_INTENT = "Delete",
            FOCUS_INTENT = "Focus",
            MOVE = "Move",
            UNDO = "Undo"
        }
        const elementId = this.properties?.elementId;

        switch(intent) {
            case Intents.CREATE_CONTAINER: {
                this.createContainer();
                break;
            }
            case Intents.ADD_ATTRIBUTE: {
                if (elementId !== undefined) {
                    this.addAttribute(elementId);
                } else {
                    this.showErrorMsg("Nothing selected, please make sure to select an element");
                }
                break;
            }
            case Intents.ADD_METHOD: {
                if (elementId !== undefined) {
                    this.addMethod(elementId);
                } else {
                    this.showErrorMsg("Nothing selected, please make sure to select an element");
                }
                break;
            }
            case Intents.CHANGE_NAME_INTENT: {
                if (elementId !== undefined) {
                    this.changeName(elementId);
                } else {
                    this.showErrorMsg("Nothing selected, please make sure to select an element");
                }
                break;
            }
            case Intents.CHANGE_VISIBILITY_INTENT:
                if (elementId !== undefined) {
                    this.changeVisibility(elementId);
                } else {
                    this.showErrorMsg("Nothing selected, please make sure to select an element");
                }
                break;
            case Intents.CHANGE_DATATYPE_INTENT:
                if (elementId !== undefined) {
                    this.changeDatatype(elementId);
                } else {
                    this.showErrorMsg("Nothing selected, please make sure to select an element");
                }
                break;
                break
            case Intents.CREATE_RELATION: {
                this.createRelation();
                break;
            }
            case Intents.DELETE_INTENT: {
                this.deleteElement(elementId);
                break;
            }
            case Intents.FOCUS_INTENT: {
                this.focusElement();
                break;
            }
            case Intents.MOVE: {
                if (elementId !== undefined) {
                    this.moveElement(elementId);
                } else {
                    this.showErrorMsg("Nothing selected, please make sure to select an element");
                }
                break;
            }
            case Intents.UNDO: {
                this.dispatchEvent(
                    new CustomEvent('dispatch-action', {
                        detail: UndoAction.create()
                    })
                );
                break;
            }
            default: {
                console.error("Buhu ;(");
            }
        }
    }

    protected async findIdByName(name: string, datatype: string) {
        const response = await fetch(NLI_SERVER_URL + `/find-id?name=${name}&element_type=${datatype}`, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json;charset=UTF-8'
            },
            method: "POST",
            body: JSON.stringify({
                uml_model: this.umlModel?.content,
                unotation_model: this.unotationModel?.content
            })
        });

        if (!response.ok) {
            this.showErrorMsg("Error while processing command");
        }
        return await response.json();
    }

    protected async createContainer() {
        const root_json = await this.findIdByName("root", "root");

        const response = await fetch(NLI_SERVER_URL + `/create-container/?user_query=${this.inputText}`, {
            headers: {
                accept: 'application/json'
            },
            method: "POST"
        });
        if (!response.ok) {
            this.showErrorMsg("Error while processing command");
        }
        const json = await response.json();

        const containerType = umlTypesMap.get(json.element_type) ?? `CLASS__Class`;

        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(containerType,
                {
                    containerId: root_json.id,
                    location: {
                        x: 0,
                        y: 0
                    },
                    args: {
                        name: json.element_name,
                        is_abstract: json.is_abstract
                    }
                })
            })
        );
    }

    // abstract parent for addAttribute and addMethod
    protected async addValue() {
        const response = await fetch(NLI_SERVER_URL + `/add-value/?user_query=${this.inputText}`, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json;charset=UTF-8'
            },
            method: "POST",
            body: JSON.stringify({
                uml_model: this.umlModel?.content,
                unotation_model: this.unotationModel?.content
            })
        });
        if (!response.ok) {
            this.showErrorMsg("Error while processing command");
        }
        return await response.json();
    }

    protected async updateValue() {
        const response = await fetch(NLI_SERVER_URL + `/update-value/?user_query=${this.inputText}`, {
            headers: {
                accept: 'application/json'
            },
            method: "POST"
        });
        if (!response.ok) {
            this.showErrorMsg("Error while processing command");
        }
        return await response.json();
    }

    protected async addAttribute(focusedElement: string) {
        const json = await this.addValue();

        // since there is currently no way to determine if a parameter should be added to a class/enum or a method, all events are triggered
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(`CLASS__Property`,
                {
                    containerId: focusedElement,
                    args: {
                        name: json.element_name,
                        type_id: json.value_datatype,
                        visibility: json.value_visibility
                    }
                })
            })
        );

        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(`CLASS__Parameter`,
                {
                    containerId: focusedElement,
                    args: {
                        name: json.element_name,
                        type_id: json.value_datatype
                    }
                })
            })
        );

        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(`CLASS__EnumerationLiteral`,
                {
                    containerId: focusedElement,
                    args: {
                        name: json.element_name
                    }
                })
            })
        );
    }

    protected async addMethod(focusedElement: string) {
        const json = await this.addValue();
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateNodeOperation.create(`CLASS__Operation`,
                {
                    containerId: focusedElement,
                    args: {
                        name: json.element_name,
                        visibility: json.value_visibility
                    }
                })
            })
        );
    }

    protected async createRelation() {
        const response = await fetch(NLI_SERVER_URL + `/add-relation/?user_query=${this.inputText}`, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json;charset=UTF-8'
            },
            method: "POST",
            body: JSON.stringify({
                uml_model: this.umlModel?.content,
                unotation_model: this.unotationModel?.content
            })
        });
        if (!response.ok) {
            this.showErrorMsg("Error while processing command");
        }
        const json = await response.json();

        const relation_type = json.relation_type === "Strong aggregation" ? "Association" : json.relation_type;

        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: CreateEdgeOperation.create(
                {
                    elementTypeId: "CLASS__" + relation_type,
                    sourceElementId: json.class_from_id,
                    targetElementId: json.class_to_id,
                    args: {
                        name: json.relation_name
                    }
                })
            })
        );
    }

    protected async deleteElement(focusedElement?: string) {

        const json = await this.find_element();

        if (json.element_id !== undefined) {

            focusedElement = json.element_id;
        }

        const elementIdList: string[] = focusedElement ? [focusedElement] : [];
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: DeleteElementOperation.create(elementIdList, {})
            })
        );
    }

    protected async changeName(focusedElement: string) {
        const json = await this.updateValue();
        this.dispatchEvent(
            new CustomEvent<Action>('dispatch-action', {
                detail: UpdateElementPropertyAction.create({
                    elementId: focusedElement,
                    propertyId: "name",
                    value: json.new_value
                })
            })
        );
    }


    protected async changeVisibility(focusedElement: string) {
        const json = await this.updateValue();

        this.dispatchEvent(
            new CustomEvent<Action>('dispatch-action', {
                detail: UpdateElementPropertyAction.create({
                    elementId: focusedElement,
                    propertyId: "visibilityKind",
                    value: json.new_value
                })
            })
        );
    }

    protected async changeDatatype(focusedElement: string) {
        const json = await this.updateValue();
        const found_json = await this.findIdByName(json.new_value, "class");  // todo "class" might be any container

        this.dispatchEvent(
            new CustomEvent<Action>('dispatch-action', {
                detail: UpdateElementPropertyAction.create({
                    elementId: focusedElement,
                    propertyId: "type",
                    value: found_json.id
                })
            })
        );
    }

    protected async find_element() {
        const response = await fetch(NLI_SERVER_URL + `/focus/?user_query=${this.inputText}`, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json;charset=UTF-8'
            },
            method: "POST",
            body: JSON.stringify({
                uml_model: this.umlModel?.content,
                unotation_model: this.unotationModel?.content
            })
        });
        if (!response.ok) {
            this.showErrorMsg("Error while processing command");
        }
        return await response.json();
    }

    protected async focusElement() {
        const json = await this.find_element();
        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: SelectAction.create({ selectedElementsIDs: [json.element_id], deselectedElementsIDs: true })
            })
        );
    }

    protected async moveElement(focusedElement: string) {
        const response = await fetch(NLI_SERVER_URL + `/move/?user_query=${this.inputText}`, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json;charset=UTF-8'
            },
            method: "POST",
            body: JSON.stringify({
                uml_model: this.umlModel?.content,
                unotation_model: this.unotationModel?.content
            })
        });
        if (!response.ok) {
            this.showErrorMsg("Error while processing command");
        }
        const json = await response.json();
        const elementAndBounds: ElementAndBounds = {
            elementId: focusedElement,
            newSize: Dimension.EMPTY,
            newPosition: {
                x: json.x_coord,
                y: json.y_coord
            }
        };

        this.dispatchEvent(
            new CustomEvent('dispatch-action', {
                detail: ChangeBoundsOperation.create([elementAndBounds])
            })
        );
    }

    protected textFieldWithButtonTemplate(): TemplateResult<1> {
        return html`
            <div class="grid-value grid-flex">
                <div style="display: flex; gap: 10px;">
                    <vscode-button id="recordButton" appearance="primary" @click="${this.onRecordActionMessageStart}">
                        Start Recording
                    </vscode-button>
                    <vscode-button appearance="primary" @click="${this.onStartIntent}">
                        Send Command
                    </vscode-button>
                </div>

                <vscode-text-field .value="${this.inputText}" @input="${this.handleInput}" @focus="${this.requestUpdate}"
                    @keydown="${(event: KeyboardEvent) => event.key === 'Enter' && this.onStartIntent()}">
                    <span slot="end" class="codicon codicon-close" style="cursor: pointer;" @click="${this.clearInput}"></span>
                </vscode-text-field>

                <div style="max-height: 150px; overflow-y: auto; border: 1px solid var(--vscode-editorWidget-border);">
                    ${Array.from(this.inputHistory.values()).reverse().map(
                    entry => html`
                    <vscode-option .value="${entry}" @click="${() => this.selectHistoryEntry(entry)}"
                        style="display: block; width: 100%;">
                        ${entry.length > 40 ? entry.substring(0, 40) + "..." : entry}
                    </vscode-option>
                    `
                    )}
                </div>
            </div>
        `
    }

    protected sendNotification(action: Action): void {
        messenger.sendNotification(ActionMessageNotification, HOST_EXTENSION, {
            clientId: this.clientId,
            action
        });
    }

    protected async getIntent(): Promise<string> {
        const response = await fetch(NLI_SERVER_URL + `/intent/?user_query=${this.inputText}`, {
            headers: {
                accept: 'application/json'
            }
        })
        if (!response.ok) {
            this.showErrorMsg(await response.text());
        }
        const json = await response.json();
        return json.intent;
    }

    protected async isNliServerRunning(timeout = 1000): Promise<boolean> {
        const controller = new AbortController();
        const signal = controller.signal;
        
        const timeoutId = setTimeout(() => controller.abort(), timeout);
    
        try {
            const response = await fetch(NLI_SERVER_URL + "/ping", { method: "GET", signal });
    
            clearTimeout(timeoutId);
    
            return response.status === 204 || response.status === 404;
        } catch (error) {
            clearTimeout(timeoutId);
            return false;
        }
    }

    protected async showErrorMsg(msg: string) {
        console.log(msg);
        this.sendNotification(NliErrorAction.create(msg));
    }
}
