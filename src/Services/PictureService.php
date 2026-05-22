<?php

namespace AmzsCMS\GalleryBundle\Services;

use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Entity\Picture;
use AmzsCMS\GalleryBundle\Repository\PictureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Query;
use Knp\Component\Pager\PaginatorInterface;

class PictureService
{
    private $pictureRepository;
    private $paginator;
    private $entityManager;

    public function __construct(PictureRepository $pictureRepository, PaginatorInterface $paginator, EntityManagerInterface $entityManager)
    {
        $this->paginator = $paginator;
        $this->pictureRepository = $pictureRepository;
        $this->entityManager = $entityManager;
    }

    public function findByGallery(Gallery $gallery)
    {
        return $this->pictureRepository->findByGallery($gallery);
    }

    public function addGlobalByGallery(Gallery $gallery, string $url, string $name, ?string $imageMobileUrl = null): void
    {
        $picture = new Picture();
        $picture->setGallery($gallery);
        $picture->setImage($url);
        $picture->setName($name);

        if ($imageMobileUrl !== null) {
            $picture->setImageMobile($imageMobileUrl);
        }

        $this->entityManager->persist($picture);
        $this->entityManager->flush();
    }

    public function findById(int $id): ?Picture
    {
        return $this->pictureRepository->find($id);
    }

    public function findAllPicture($search): Query
    {
        return $this->pictureRepository->findAllPicture($search)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->setHint(Query::HINT_READ_ONLY, true);
    }
}