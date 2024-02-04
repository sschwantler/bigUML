/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 ********************************************************************************/
package com.eclipsesource.uml.glsp.uml.diagram.sequence_diagram.uml.handler;

import java.util.Optional;

import org.eclipse.glsp.graph.GPoint;
import org.eclipse.glsp.server.operations.CreateNodeOperation;
import org.eclipse.glsp.server.utils.LayoutUtil;

import com.eclipsesource.uml.glsp.core.model.UmlModelState;

public interface SDCreateLocationAwarePortHandler {
   default Optional<GPoint> relativeLocationOf(final UmlModelState modelState, final CreateNodeOperation operation) {
      var absoluteLocation = operation.getLocation();
      var container = modelState.getIndex().get(operation.getContainerId()).orElseGet(modelState::getRoot);
      return absoluteLocation.map(location -> LayoutUtil.getRelativeLocation(location, container));
   }
}