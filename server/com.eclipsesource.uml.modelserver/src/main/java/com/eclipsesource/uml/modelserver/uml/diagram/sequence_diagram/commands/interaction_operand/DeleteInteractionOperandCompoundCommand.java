/********************************************************************************
 * Copyright (c) 2021 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 ********************************************************************************/
package com.eclipsesource.uml.modelserver.uml.diagram.sequence_diagram.commands.interaction_operand;

import org.eclipse.emf.common.command.CompoundCommand;
import org.eclipse.uml2.uml.InteractionOperand;

import com.eclipsesource.uml.modelserver.shared.model.ModelContext;
import com.eclipsesource.uml.modelserver.shared.notation.commands.DeleteNotationElementCommand;
import com.eclipsesource.uml.modelserver.uml.diagram.sequence_diagram.matcher.SequenceDiagramCrossReferenceRemover;

public final class DeleteInteractionOperandCompoundCommand extends CompoundCommand {

   public DeleteInteractionOperandCompoundCommand(final ModelContext context,
      final InteractionOperand semanticElement) {
      this.append(new DeleteInteractionOperandSemanticCommand(context, semanticElement));
      this.append(new DeleteNotationElementCommand(context, semanticElement));

      new SequenceDiagramCrossReferenceRemover(context).deleteCommandsFor(semanticElement)
         .forEach(this::append);
   }
}