package com.eclipsesource.uml.modelserver.uml.diagram.package_diagram.commands.package_import;

import org.eclipse.emf.common.command.Command;
import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.edit.domain.EditingDomain;
import org.eclipse.emfcloud.modelserver.command.CCommand;
import org.eclipse.emfcloud.modelserver.common.codecs.DecodingException;
import org.eclipse.emfcloud.modelserver.edit.command.BasicCommandContribution;
import org.eclipse.uml2.uml.Package;

import com.eclipsesource.uml.modelserver.core.commands.noop.NoopCommand;
import com.eclipsesource.uml.modelserver.shared.codec.ContributionDecoder;
import com.eclipsesource.uml.modelserver.shared.codec.ContributionEncoder;

public final class CreatePackageImportContribution extends BasicCommandContribution<Command> {

   public static final String TYPE = "package:add_package_import";

   public static CCommand create(final Package source, final Package target) {
      return new ContributionEncoder().type(TYPE).source(source).target(target).ccommand();
   }

   @Override
   protected Command toServer(final URI modelUri, final EditingDomain domain, final CCommand command)
      throws DecodingException {
      var decoder = new ContributionDecoder(modelUri, domain, command);

      var context = decoder.context();
      var source = decoder.source(Package.class);
      var target = decoder.target(Package.class);

      if (source.isPresent() && target.isPresent()) {
         return new CreatePackageImportCompoundCommand(context, source.get(), target.get());
      }

      return new NoopCommand();
   }

}