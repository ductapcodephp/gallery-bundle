<?php

namespace AmzsCMS\GalleryBundle\Repository;

use AmzsCMS\GalleryBundle\Entity\Gallery;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Query;
use Doctrine\Persistence\ManagerRegistry;
use AmzsCMS\GalleryBundle\Entity\GalleryPictures;

class GalleryPicturesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GalleryPictures::class);
    }

    public function findPicturesInFolder($currentFolder): array
    {
        return $this->createQueryBuilder('gp')
            ->addSelect('p')
            ->leftJoin('gp.picture', 'p')
            ->where('gp.gallery = :gallery')
            ->setParameter('gallery', $currentFolder)
            ->getQuery()
            ->getResult();
    }

    public function findPicturesInRoot(): array
    {
        return $this->createQueryBuilder('gp')
            ->addSelect('p')
            ->leftJoin('gp.picture', 'p')
            ->where('gp.gallery IS NULL')
            ->getQuery()
            ->getResult();
    }
    public function getPicturesInFolderQuery($currentFolder): Query
    {
        return $this->createQueryBuilder('gp')
            ->addSelect('p')
            ->leftJoin('gp.picture', 'p')
            ->where('gp.gallery = :gallery')
            ->setParameter('gallery', $currentFolder)
            ->getQuery();
    }

    public function getPicturesInRootQuery(): Query
    {
        return $this->createQueryBuilder('gp')
            ->addSelect('p')
            ->leftJoin('gp.picture', 'p')
            ->where('gp.gallery IS NULL')
            ->getQuery();
    }
}