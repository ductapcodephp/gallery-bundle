<?php

namespace AmzsCMS\GalleryBundle\Services;

use AmzsCMS\GalleryBundle\Repository\GalleryRepository;
use Doctrine\ORM\Query;

class GalleryService
{
    private GalleryRepository $galleryRepository;

    public function __construct(
         GalleryRepository $galleryRepository
    )
    {
        $this->galleryRepository = $galleryRepository;
    }

    public function find($id, $lockMode = null, $lockVersion = null)
    {
        return $this->galleryRepository->find($id, $lockMode, $lockVersion);
    }

    public function findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
    {
        return $this->galleryRepository->findBy($criteria, $orderBy, $limit, $offset);
    }

    public function getPaginated($keyword, $filters)
    {
        return $this->galleryRepository->getPaginated($keyword, 'post', $filters)
            ->orderBy('gallery.createdAt', 'DESC')
            ->getQuery()->setHint(Query::HINT_READ_ONLY, true);
    }

    public function getPaginatedDetail($keyword, $filters)
    {
        return $this->galleryPictureRepository->getPaginatedDetail($keyword, 'post', $filters)
            ->orderBy('gallery.createdAt', 'DESC')
            ->getQuery()->setHint(Query::HINT_READ_ONLY, true);
    }
}