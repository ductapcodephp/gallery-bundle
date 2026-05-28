<?php

namespace AmzsCMS\GalleryBundle\Services;

use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Repository\GalleryRepository;

class GalleryService
{
    private $galleryRepository;

    public function __construct(GalleryRepository $galleryRepository)
    {
        $this->galleryRepository = $galleryRepository;
    }

    public function find($id)
    {
        return $this->galleryRepository->find($id);
    }

    public function getFolders(?Gallery $currentFolder)
    {
        if ($currentFolder === null) {
            return $this->galleryRepository->getAllGalleriesRoot();
        }

        return $currentFolder->getChildren();
    }


    public function getBreadcrumbs(?Gallery $currentFolder): array
    {
        $breadcrumbs = [['id' => 0, 'name' => 'Thư mục gốc']];

        if ($currentFolder !== null) {
            $node = $currentFolder;
            $pathNodes = [];
            while ($node !== null) {
                array_unshift($pathNodes, ['id' => $node->getId(), 'name' => $node->getName()]);
                $node = $node->getParent();
            }
            $breadcrumbs = array_merge($breadcrumbs, $pathNodes);
        }

        return $breadcrumbs;
    }
}