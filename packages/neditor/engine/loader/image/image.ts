// This class represents a general image that is stored in memory. It can be
// either a static image or an animated image. It is intended to be cached in
// an ImageCache.
import { Size } from '../../math/size';
import { Image as RendererTreeImage } from '../../render_tree/image';
import type { IResourceType } from '../resource_cache';
import { TypeId } from '../../base/type_id';

export abstract class Image extends RendererTreeImage implements IResourceType {
}

// StaticImage is a wrapper around render_tree::ImageParser. The images will be
// decoded immediately after fetching and stored in memory.
// parse class StaticImage extends ImageParser {
//
//   private image_: RendererTreeImage;
//   constructor(image: RendererTreeImage) {
//     super();
//     this.image_ = image;
//   }
//
//   GetTypeId(): TypeId {
//     return this.image_.GetTypeId();
//   }
//
//   GetSize(): Size { return this.image_.GetSize(); }
//
//   GetEstimatedSizeInBytes(): number {
//     return this.image_.GetEstimatedSizeInBytes();
//   }
//
//   IsAnimated() { return false; }
//
//   IsOpaque() { return this.image_.IsOpaque(); }
//
//   GetImage() { return this.image_; }
// };

// // Concrete implementations of AnimatedImage should include mechanisms that
// // balance the tradeoff between space usage and efficiency of decoding frames
// // when playing animation.
// class AnimatedImage : public ImageParser {
//  public:
//   // FrameProvider nested classes are used as "frame containers".  Typically
//   // they will be created by an AnimatedImage and have frames pushed into them
//   // by the creating AnimatedImage object.  They can be handed to consumers to
//   // have frames pulled out of them.  Its purpose is to allow AnimatedImage
//   // objects to be destroyed without affecting consumers of the FrameProvider.
//   // If the AnimatedImage is destroyed before the consumer is done pulling
//   // frames out of FrameProvider, they will simply be left with the last frame
//   // that was in there.
//   class FrameProvider : public base::RefCountedThreadSafe<FrameProvider> {
//    public:
//     FrameProvider() : frame_consumed_(true) {}
//
//     void SetFrame(const scoped_refptr<render_tree::ImageParser>& frame) {
//       base::AutoLock lock(mutex_);
//       frame_ = frame;
//       frame_consumed_ = false;
//     }
//
//     bool FrameConsumed() const {
//       base::AutoLock lock(mutex_);
//       return frame_consumed_;
//     }
//
//     scoped_refptr<render_tree::ImageParser> GetFrame() {
//       base::AutoLock lock(mutex_);
//       frame_consumed_ = true;
//       return frame_;
//     }
//
//    private:
//     virtual ~FrameProvider() {}
//     friend class base::RefCountedThreadSafe<FrameProvider>;
//
//     mutable base::Lock mutex_;
//     // True if a call to FrameConsumed() has been made after the last call to
//     // SetFrame().
//     bool frame_consumed_;
//     scoped_refptr<render_tree::ImageParser> frame_;
//   };
//
//   bool IsAnimated() const override { return true; }
//
//   bool IsOpaque() const override { return false; }
//
//   // Start playing the animation, decoding on the given message loop.
//   // Implementation should be thread safe.
//   virtual void Play(
//       const scoped_refptr<base::SingleThreadTaskRunner>& message_loop) = 0;
//
//   // Stop playing the animation.
//   virtual void Stop() = 0;
//
//   // Returns a FrameProvider object from which frames can be pulled out of.
//   // The AnimatedImage object is expected to push frames into the FrameProvider
//   // as it generates them.
//   virtual scoped_refptr<FrameProvider> GetFrameProvider() = 0;
//
//   // This callback is intended to be used in a render_tree::AnimateNode.
//   static void AnimateCallback(
//       scoped_refptr<FrameProvider> frame_provider,
//       const math::RectF& destination_rect,
//       const math::Matrix3F& local_transform,
//       render_tree::ImageNode::Builder* image_node_builder) {
//     image_node_builder->source = frame_provider->GetFrame();
//     image_node_builder->destination_rect = destination_rect;
//     image_node_builder->local_transform = local_transform;
//   }
// };
