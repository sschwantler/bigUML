/********************************************************************************
 * Copyright (c) 2023 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 ********************************************************************************/
package com.eclipsesource.uml.glsp.uml.diagram.sequence_diagram.features.property_palette;

import java.util.Optional;

import org.eclipse.uml2.uml.Message;
import org.eclipse.uml2.uml.MessageSort;
import org.eclipse.uml2.uml.VisibilityKind;

import com.eclipsesource.uml.glsp.core.handler.operation.update.UpdateOperation;
import com.eclipsesource.uml.glsp.features.property_palette.handler.action.UpdateElementPropertyAction;
import com.eclipsesource.uml.glsp.features.property_palette.model.PropertyPalette;
import com.eclipsesource.uml.glsp.uml.diagram.sequence_diagram.diagram.UmlSequence_Message;
import com.eclipsesource.uml.glsp.uml.diagram.sequence_diagram.handler.operation.message.UpdateMessageHandler;
import com.eclipsesource.uml.glsp.uml.diagram.sequence_diagram.utils.MessageTypeUtil;
import com.eclipsesource.uml.glsp.uml.features.property_palette.BaseDiagramElementPropertyMapper;
import com.eclipsesource.uml.glsp.uml.utils.element.VisibilityKindUtils;
import com.eclipsesource.uml.modelserver.uml.diagram.sequence_diagram.commands.message.UpdateMessageArgument;

public class MessagePropertyMapper extends BaseDiagramElementPropertyMapper<Message> {

   @Override
   public PropertyPalette map(final Message source) {
      var elementId = idGenerator.getOrCreateId(source);

      var items = this.propertyBuilder(UmlSequence_Message.Property.class, elementId)
         .text(UmlSequence_Message.Property.NAME, "Name", source.getName(), false)
         .choice(UmlSequence_Message.Property.MESSAGE_SORT, "Sort", MessageTypeUtil.asChoices(),
            source.getMessageSort().getLiteral(), false)
         .text(UmlSequence_Message.Property.MESSAGE_KIND, "Kind", source.getMessageKind().getLiteral(), true)
         .choice(
            UmlSequence_Message.Property.VISIBILITY_KIND,
            "Visibility",
            VisibilityKindUtils.asChoices(),
            source.getVisibility().getLiteral(), false)
         .items();

      return new PropertyPalette(elementId, source.getName(), items);
   }

   @Override
   public Optional<UpdateOperation> map(final UpdateElementPropertyAction action) {
      var property = getProperty(UmlSequence_Message.Property.class, action);
      var handler = getHandler(UpdateMessageHandler.class, action);
      UpdateOperation operation = null;

      switch (property) {
         case NAME:
            operation = handler.withArgument(
               new UpdateMessageArgument.Builder()
                  .name(action.getValue())
                  .get());
            break;
         case MESSAGE_SORT:
            operation = handler.withArgument(
               new UpdateMessageArgument.Builder()
                  .messageSort(MessageSort.get(action.getValue()))
                  .get());
            break;
         case MESSAGE_KIND:
            break;
         case VISIBILITY_KIND:
            operation = handler.withArgument(
               new UpdateMessageArgument.Builder()
                  .visibilityKind(VisibilityKind.get(action.getValue()))
                  .get());
            break;
      }

      return withContext(operation);

   }

}