interface Image {
  url: string;
  width?: number;
  height?: number;
}

export const getHighestResolutionImage = (images: Image[]) => {
  if (images.length === 0) {
    return undefined;
  }
  let highestResolutionImage = images[0];
  for (let i = 1; i < images.length; ++i) {
    const theImage = images[i];
    const theImageResolution = (theImage.width ?? 1) * (theImage.height ?? 1);
    const highestResolutionImageResolution = (highestResolutionImage.width ?? 1) * (highestResolutionImage.height ?? 1);
    if (theImageResolution > highestResolutionImageResolution) {
      highestResolutionImage = theImage;
    }
  }
  return highestResolutionImage;
};
