import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEntityPhotos } from '@/hooks/useEntityPhotos'; // Changed import
import { Upload, Trash2, Star, X } from 'lucide-react';

interface PhotoGalleryProps {
  entityId: string; // Changed from propertyId
  editable?: boolean;
}

const PhotoGallery = ({ entityId, editable = false }: PhotoGalleryProps) => { // Changed from propertyId
  const { photos, isLoading, uploadPhoto, deletePhoto, setPrimaryPhoto } = useEntityPhotos(entityId); // Changed hook usage
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadPhoto.mutateAsync({ file, entityId }); // Changed prop name
      }
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja remover esta foto?')) {
      await deletePhoto.mutateAsync(photoId);
    }
  };

  const handleSetPrimary = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await setPrimaryPhoto.mutateAsync(photoId);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editable && (
        <div>
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <label htmlFor="photo-upload">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById('photo-upload')?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Enviando...' : 'Adicionar Fotos'}
            </Button>
          </label>
        </div>
      )}

      {photos.length === 0 ? (
        <Card className="p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Nenhuma foto adicionada</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div
                className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo.photo_url)}
              >
                <img
                  src={photo.photo_url}
                  alt="Property"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              
              {photo.is_primary && (
                <Badge className="absolute top-2 left-2" variant="default">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Principal
                </Badge>
              )}

              {editable && (
                <div className="absolute top-2 right-2 flex gap-2">
                  {!photo.is_primary && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleSetPrimary(photo.id, e)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(photo.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Property"
                className="w-full h-auto rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;