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

    public function getSidebarFolders()
    {
        return $this->galleryRepository->getRootNodes('name', 'asc');
    }

    public function getFolders(?Gallery $currentFolder)
    {
        if ($currentFolder === null) {
            return $this->galleryRepository->findBy(['parent' => null], ['name' => 'ASC']);
        }

        return $this->galleryRepository->getChildren($currentFolder, true, 'name', 'asc');
    }

    public function getBreadcrumbs(?Gallery $currentFolder): array
    {
        $breadcrumbs = [];
        if ($currentFolder !== null) {
            $nodes = $this->galleryRepository->getPath($currentFolder);
            foreach ($nodes as $node) {
                $breadcrumbs[] = ['id' => $node->getId(), 'name' => $node->getName()];
            }
        }
        return $breadcrumbs;
    }
}