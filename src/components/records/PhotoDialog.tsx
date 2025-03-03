
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

interface PhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  selectedIndex: number;
  onNext: () => void;
  onPrev: () => void;
  title: string;
}

const PhotoDialog: React.FC<PhotoDialogProps> = ({
  open,
  onOpenChange,
  photos,
  selectedIndex,
  onNext,
  onPrev,
  title
}) => {
  if (photos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] w-[95vw] max-h-[90vh] p-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            Foto {selectedIndex + 1} de {photos.length}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-2">
          <img
            src={photos[selectedIndex]}
            alt={`Foto ${selectedIndex + 1}`}
            className="max-h-[60vh] w-full object-contain rounded-md"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
            }}
          />
        </div>
        {photos.length > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={onPrev} className="h-8 px-3 text-xs">
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={onNext} className="h-8 px-3 text-xs">
              Siguiente
            </Button>
          </div>
        )}
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)} className="h-8 px-3 text-xs w-full sm:w-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoDialog;
