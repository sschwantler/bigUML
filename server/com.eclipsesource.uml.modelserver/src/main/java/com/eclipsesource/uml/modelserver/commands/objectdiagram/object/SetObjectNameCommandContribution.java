package com.eclipsesource.uml.modelserver.commands.objectdiagram.object;

import com.eclipsesource.uml.modelserver.commands.classdiagram.clazz.SetClassNameCommand;
import com.eclipsesource.uml.modelserver.commands.commons.contributions.UmlSemanticCommandContribution;
import org.eclipse.emf.common.command.Command;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.edit.domain.EditingDomain;
import org.eclipse.emfcloud.modelserver.command.CCommand;
import org.eclipse.emfcloud.modelserver.command.CCommandFactory;
import org.eclipse.emfcloud.modelserver.common.codecs.DecodingException;

public class SetObjectNameCommandContribution extends UmlSemanticCommandContribution {

    public static final String TYPE = "setObjectName";
    public static final String NEW_NAME = "newName";

    public static CCommand create(final String semanticUri, final String newName) {
        CCommand setObjectNameCommand = CCommandFactory.eINSTANCE.createCommand();
        setObjectNameCommand.setType(TYPE);
        setObjectNameCommand.getProperties().put(SEMANTIC_URI_FRAGMENT, semanticUri);
        setObjectNameCommand.getProperties().put(NEW_NAME, newName);
        return setObjectNameCommand;
    }

    @Override
    protected Command toServer(final URI modelUri, final EditingDomain domain, final CCommand commmand)
            throws DecodingException {
        String semanticUriFragment = commmand.getProperties().get(SEMANTIC_URI_FRAGMENT);
        String newName = commmand.getProperties().get(NEW_NAME);

        return new SetClassNameCommand(domain, modelUri, semanticUriFragment, newName);
    }
}