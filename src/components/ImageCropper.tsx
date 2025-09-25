import * as React from 'react';
import type { Crop, PixelCrop } from 'react-image-crop';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Función auxiliar para centrar el recorte
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onClose: () => void;
  aspect?: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  onCropComplete,
  onClose,
  aspect = 1,
}) => {
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const imgRef = React.useRef<HTMLImageElement>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);


  // Cuando la imagen se carga, configuramos el recorte inicial
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  // Función para dibujar la vista previa del recorte
  const drawImageOnCanvas = React.useCallback(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio;

    if (!ctx) {
      return;
    }

    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      crop.width,
      crop.height,
    );
  }, [completedCrop]);

  // Efecto para dibujar la vista previa cuando cambia el recorte
  React.useEffect(() => {
    drawImageOnCanvas();
  }, [drawImageOnCanvas]);


  // Función para manejar el clic en el botón de recortar
  const handleCropComplete = () => {
    if (!completedCrop || !previewCanvasRef.current) {
      onClose();
      return;
    }

    // Obtener la imagen recortada como base64
    const croppedImageUrl = previewCanvasRef.current.toDataURL('image/png');
    onCropComplete(croppedImageUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-700 dark:text-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recortar imagen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4 flex justify-center">
            {imageUrl && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-h-[60vh]"
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageUrl}
                    onLoad={onImageLoad}
                    className="max-h-[60vh] max-w-full"
                  />
                </ReactCrop>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Vista previa del recorte:</p>
                <div className="inline-block border border-gray-200 p-2 rounded">
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      display: 'block',
                      maxWidth: '200px',
                      maxHeight: '200px',
                      width: '100%',
                      height: 'auto',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCropComplete}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Aplicar recorte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
