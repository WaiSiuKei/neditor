// Layer represents the render layer corresponding to the main web
// module, the splash screen, or the debug console and are used to
// create and submit a combined tree to the RendererModule's
// pipeline. Layers are combined in order of the |z_index| specified
// at the Layers' creation. The RenderTreeCombiner stores pointers
// to Layers. The Layers are owned by the caller of
// RenderTreeCombiner::CreateLayer.
import { Optional } from '@neditor/core/base/common/typescript';
import { Submission } from '../renderer/submission';
import { TimeDelta, TimeTicks } from '@neditor/core/base/time/time';
import { DCHECK } from '@neditor/core/base/check';
import { CompositionNode, CompositionNodeBuilder } from '../render_tree/composition_node';

export class Layer {
  Reset() {
    this.render_tree_ = undefined;
    this.receipt_time_ = undefined;
  }

  // Submit render tree to the layer, and specify whether the time
  // received should be stored.
  Submit(render_tree_submission: Optional<Submission>) {
    this.render_tree_ = render_tree_submission;
    this.receipt_time_ = TimeTicks.Now();
  }

  HasRenderTree() { return !!this.render_tree_; }

  // Returns a current submission object that can be passed into a renderer
  // for rasterization.  If the render tree does not exist, this will
  // return a base::nullopt.
  GetCurrentSubmission(): Optional<Submission> {
    const { render_tree_ } = this;
    if (!render_tree_) {
      return undefined;
    }

    let current_time_offset = this.CurrentTimeOffset();
    DCHECK(current_time_offset);
    let submission = new Submission(render_tree_.render_tree, current_time_offset);
    submission.timeline_info = render_tree_.timeline_info;
    submission.on_rasterized_callbacks = render_tree_.on_rasterized_callbacks.slice();

    return submission;
  }

  constructor(render_tree_combiner: RenderTreeCombiner) {
    this.render_tree_combiner_ = render_tree_combiner;
  }

  // Returns the current submission time for this particular layer.  This is
  // called by the RenderTreeCombiner on the |timeline_layer_| to determine
  // which value to pass in as the submission time for the renderer.
  CurrentTimeOffset(): Optional<TimeDelta> {
    if (!this.receipt_time_) {
      return undefined;
    } else {
      DCHECK(this.render_tree_);
      return this.render_tree_!.time_offset.ADD((TimeTicks.Now().SUB(this.receipt_time_)));
    }
  }

  private render_tree_combiner_: RenderTreeCombiner;

  render_tree_: Optional<Submission>;
  private receipt_time_: Optional<TimeTicks>;
};

// Combines rendering layers (such as the main, splash screen, and
// debug console). Caches the individual trees as they are produced.
// Re-renders when any tree changes.
export class RenderTreeCombiner {

  // Create a Layer with a given |z_index|. If a Layer already exists
  // at |z_index|, return NULL, and no Layer is created.
  CreateLayer(z_index: number): Optional<Layer> {
    if (this.layers_.has(z_index)) {
      return undefined;
    }
    let layer = new Layer(this);
    this.layers_.set(z_index, layer);

    return layer;
  }

  // Returns a current submission object that can be passed into a renderer
  // for rasterization.  If no layers with render trees exist, this will return
  // a base::nullopt.
  GetCurrentSubmission(): Optional<Submission> {
    let builder = new CompositionNodeBuilder();

    // Add children for all layers in order.
    let first_layer_with_render_tree: Layer;
    let on_rasterized_callbacks: Array<Function> = [];
    for (let [z_index, layer] of this.layers_) {
      if (layer.render_tree_) {
        builder.AddChild(layer.render_tree_.render_tree);
        first_layer_with_render_tree = layer;
        on_rasterized_callbacks.push(
          ...layer.render_tree_.on_rasterized_callbacks
        );
      }
    }
    if (!first_layer_with_render_tree!) {
      return undefined;
    }

    let timeline_layer = (this.timeline_layer_ && this.timeline_layer_.render_tree_)
      ? this.timeline_layer_
      : first_layer_with_render_tree;

    let submission = new Submission(new CompositionNode(builder), timeline_layer.CurrentTimeOffset());
    submission.timeline_info = timeline_layer.render_tree_!.timeline_info;
    submission.on_rasterized_callbacks = on_rasterized_callbacks;

    return submission;
  }

  // Names a single layer as the one responsible for providing the timeline
  // id and configuration to the output combined render tree.  Only a single
  // layer can be responsible for providing the timeline.
  SetTimelineLayer(layer: Layer) {
    if (layer) {
      DCHECK(this.OwnsLayer(layer));
    }

    this.timeline_layer_ = layer;
  }

  // Returns true if the specified layer exists in this render tree combiner's
  // current list of layers (e.g. |layers_|).
  private OwnsLayer(layer: Layer): boolean {
    for (let iter_layer of this.layers_.values()) {
      if (iter_layer === layer) {
        return true;
      }
    }
    return false;
  }

  // The layers keyed on their z_index.
  private layers_ = new Map<number, Layer>();

  // Removes a layer from |layers_|. Called by the Layer destructor.
  RemoveLayer(layer: Layer) {}

  // Which layer is currently controlling the receipt time submitted to the
  // rasterizer.
  private timeline_layer_?: Layer;
}

