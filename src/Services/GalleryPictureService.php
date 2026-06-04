<?php

namespace AmzsCMS\GalleryBundle\Services;

use AmzsCMS\GalleryBundle\Repository\GalleryPicturesRepository;
use Knp\Component\Pager\PaginatorInterface;
use Knp\Component\Pager\Pagination\PaginationInterface;

class GalleryPictureService
{
    private $galleryPicturesRepository;
    private $paginator;

    public function __construct(
        GalleryPicturesRepository $galleryPicturesRepository,
        PaginatorInterface $paginator
    ) {
        $this->galleryPicturesRepository = $galleryPicturesRepository;
        $this->paginator = $paginator;
    }

    public function find($id, $lockMode = null, $lockVersion = null)
    {
        return $this->galleryPicturesRepository->find($id, $lockMode, $lockVersion);
    }

    public function findBy($criteria, $orderBy = null, $limit = null, $offset = null)
    {
        return $this->galleryPicturesRepository->findBy($criteria, $orderBy, $limit, $offset);
    }

    public function getPaginatedPictures(?object $currentFolder, int $page, int $limit = 1): PaginationInterface
    {
        if ($currentFolder === null) {
            $query = $this->galleryPicturesRepository->getPicturesInRootQuery();
        } else {
            $query = $this->galleryPicturesRepository->getPicturesInFolderQuery($currentFolder);
        }

        return $this->paginator->paginate($query, $page, $limit);
    }


}