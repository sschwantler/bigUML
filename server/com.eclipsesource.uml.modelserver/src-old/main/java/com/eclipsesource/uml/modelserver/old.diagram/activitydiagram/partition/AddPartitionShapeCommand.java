package com.eclipsesource.uml.modelserver.old.diagram.activitydiagram.partition;

public class AddPartitionShapeCommand { /*-

   protected Supplier<ActivityPartition> activityPartitionSupplier;
   protected final GPoint shapePosition;
   protected String semanticProxyUri;

   private AddPartitionShapeCommand(final EditingDomain domain, final URI modelUri, final GPoint position) {
      super(domain, modelUri);
      this.shapePosition = position;
      this.activityPartitionSupplier = null;
      this.semanticProxyUri = null;
   }

   public AddPartitionShapeCommand(final EditingDomain domain, final URI modelUri, final GPoint position,
      final String semanticProxyUri) {
      this(domain, modelUri, position);
      this.semanticProxyUri = semanticProxyUri;
   }

   public AddPartitionShapeCommand(final EditingDomain domain, final URI modelUri, final GPoint position,
      final Supplier<ActivityPartition> activityPartitionSupplier) {
      this(domain, modelUri, position);
      this.activityPartitionSupplier = activityPartitionSupplier;

   }

   @Override
   protected void doExecute() {
      Shape newShape = UnotationFactory.eINSTANCE.createShape();
      newShape.setPosition(this.shapePosition);
      SemanticProxy proxy = UnotationFactory.eINSTANCE.createSemanticProxy();
      if (this.semanticProxyUri != null) {
         proxy.setUri(this.semanticProxyUri);
      } else {
         proxy.setUri(UmlNotationCommandUtil.getSemanticProxyUri(activityPartitionSupplier.get()));
      }
      newShape.setSemanticElement(proxy);
      umlDiagram.getElements().add(newShape);
   }
      */
}