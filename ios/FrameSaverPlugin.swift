import Photos
import Foundation
import CoreImage

@objc
public class FrameSaverPlugin: FrameProcessorPlugin {
  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable : Any]?) -> Any? {
    let buffer = frame.buffer
    
    let imageBuffer = CMSampleBufferGetImageBuffer(buffer)!
    let albumName = arguments!["albumName"] as! String
    
    
    let ciImage = CIImage(cvImageBuffer: imageBuffer);
    ciImage.saveToAlbum(albumName: albumName)
    
    return nil
  }
}

extension CIImage {
  func saveToAlbum(albumName: String) {
    let input = self
    
    let context = CIContext() // Prepare for create CGImage
    guard let cgimg = context.createCGImage(input, from: input.extent) else { return }
    let output = UIImage(cgImage: cgimg)
    
    output.saveToAlbum(albumName: albumName)
  }
}

extension UIImage {
  
  func saveToAlbum(albumName: String) {
    var albumPlaceholder: PHObjectPlaceholder?
    
    // Check if the album already exists
    let fetchOptions = PHFetchOptions()
    fetchOptions.predicate = NSPredicate(format: "title = %@", albumName)
    let album = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: fetchOptions).firstObject
    
    if let existingAlbum = album {
      // Album already exists, add the image to it
      self.addToAlbum(album: existingAlbum)
    } else {
      // Album doesn't exist, create it first
      PHPhotoLibrary.shared().performChanges({
        let createAlbumRequest = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: albumName)
        albumPlaceholder = createAlbumRequest.placeholderForCreatedAssetCollection
      }, completionHandler: { success, error in
        if success, let createdAlbum = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [albumPlaceholder!.localIdentifier], options: nil).firstObject {
          // Album created successfully, add the image to it
          self.addToAlbum(album: createdAlbum)
          print("Image saved to \(albumName) album.")
        } else {
          // An error occurred or album creation was not successful
          if let error = error {
            print("Error creating album: \(error.localizedDescription)")
          } else {
            print("Unable to create album.")
          }
        }
      })
    }
  }
  
  func addToAlbum(album: PHAssetCollection) {
    PHPhotoLibrary.shared().performChanges({
      let createAssetRequest = PHAssetChangeRequest.creationRequestForAsset(from: self)
      guard let albumChangeRequest = PHAssetCollectionChangeRequest(for: album) else {
        return
      }
      let assetPlaceholder = createAssetRequest.placeholderForCreatedAsset
      albumChangeRequest.addAssets([assetPlaceholder!] as NSArray)
    }, completionHandler: { success, error in
      if let error = error {
        print("Error adding image to album: \(error.localizedDescription)")
      }
    })
  }
}
