/*********************************************************************************
 * Copyright (c) 2023 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/
import { containerFeature, Hoverable } from '@eclipse-glsp/client';
// eslint-disable-next-line no-restricted-imports
import { GUMLCompartment } from '../../views/uml-compartment';

export class GCompartmentContainer extends GUMLCompartment implements Hoverable {
    static override readonly DEFAULT_FEATURES = [...GUMLCompartment.DEFAULT_FEATURES, containerFeature];

    hoverFeedback = false;
}
