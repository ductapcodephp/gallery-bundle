<?php

namespace AmzsCMS\GalleryBundle\Services;

use AmzsCMS\GalleryBundle\Repository\GalleryPicturesRepository;

class GalleryPictureService
{
    private $galleryPicturesRepository;
    public function __construct(GalleryPicturesRepository $galleryPicturesRepository)
    {
        $this->galleryPicturesRepository = $galleryPicturesRepository;
    }

    public function find($id, $lockMode = null, $lockVersion = null)
    {
        return $this->galleryPicturesRepository->find($id, $lockMode, $lockVersion);
    }

    public function findBy($criteria, $orderBy = null, $limit = null, $offset = null)
    {
        return $this->galleryPicturesRepository->findBy($criteria, $orderBy, $limit, $offset);
    }
}